from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from interactions.models import Notification
from posts.models import Post

User = get_user_model()


class NotificationTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.alice = User.objects.create_user(username="alice", password="x", email="alice@t.com")
        cls.bob = User.objects.create_user(username="bob", password="x", email="bob@t.com")

    def test_recipient_le_apenas_as_proprias(self):
        Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="follow")
        Notification.objects.create(recipient=self.bob, actor=self.alice, tipo="follow")

        self.client.force_authenticate(self.alice)
        resp = self.client.get(reverse("notification-list"))
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["actor_nome"], self.bob.nome_exibicao)

    def test_filtro_lida_false(self):
        n1 = Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="follow", lida=True)
        Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="follow", lida=False)

        self.client.force_authenticate(self.alice)
        resp = self.client.get(reverse("notification-list"), {"lida": "false"})
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        ids = {n["id"] for n in data}
        self.assertNotIn(n1.id, ids)
        self.assertEqual(len(data), 1)

    def test_marca_como_lida(self):
        n = Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="follow")
        self.client.force_authenticate(self.alice)
        resp = self.client.patch(reverse("notification-detail", args=[n.id]), {"lida": True}, format="json")
        self.assertEqual(resp.status_code, 200)
        n.refresh_from_db()
        self.assertTrue(n.lida)

    def test_nao_marca_notificacao_alheia(self):
        n = Notification.objects.create(recipient=self.bob, actor=self.alice, tipo="follow")
        self.client.force_authenticate(self.alice)
        resp = self.client.patch(reverse("notification-detail", args=[n.id]), {"lida": True}, format="json")
        self.assertEqual(resp.status_code, 404)  # fora do queryset, nem existe pra ela

    def test_marcar_tudo_lido(self):
        Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="follow")
        Notification.objects.create(recipient=self.alice, actor=self.bob, tipo="like")
        self.client.force_authenticate(self.alice)
        resp = self.client.patch(reverse("notification-marcar-tudo-lido"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Notification.objects.filter(recipient=self.alice, lida=False).count(), 0)

    def test_anonimo_nao_acessa(self):
        resp = self.client.get(reverse("notification-list"))
        self.assertEqual(resp.status_code, 401)
