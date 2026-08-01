from django.urls import reverse

from interactions.models import Follow
from posts.tests.base import PostsBaseTestCase


def _rows(resp):
    data = resp.data
    if isinstance(data, dict) and "results" in data:
        data = data["results"]
    return data


class FollowCreateTests(PostsBaseTestCase):
    def test_segue_usuario(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(reverse("follow-list"), {"followed": self.pastor.id})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["follower"], self.membro_c1a.id)

    def test_nao_segue_a_si_mesmo(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(
            reverse("follow-list"), {"followed": self.membro_c1a.id}
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Follow.objects.count(), 0)

    def test_follow_duplicado_bloqueado(self):
        self.client.force_authenticate(user=self.membro_c1a)
        url = reverse("follow-list")
        self.assertEqual(
            self.client.post(url, {"followed": self.pastor.id}).status_code, 201
        )
        r2 = self.client.post(url, {"followed": self.pastor.id})
        self.assertEqual(r2.status_code, 400)


class FollowListTests(PostsBaseTestCase):
    def test_lista_seguidos_por_default(self):
        Follow.objects.create(follower=self.membro_c1a, followed=self.pastor)
        Follow.objects.create(follower=self.membro_c1a, followed=self.lider_c1a)
        Follow.objects.create(follower=self.solto, followed=self.membro_c1a)  # ruído
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("follow-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            {row["followed"] for row in _rows(resp)},
            {self.pastor.id, self.lider_c1a.id},
        )

    def test_lista_seguidores_com_rel(self):
        Follow.objects.create(follower=self.solto, followed=self.membro_c1a)
        Follow.objects.create(follower=self.pastor, followed=self.membro_c1a)
        Follow.objects.create(
            follower=self.membro_c1a, followed=self.lider_c1a
        )  # ruído
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("follow-list"), {"rel": "followers"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            {row["follower"] for row in _rows(resp)},
            {self.solto.id, self.pastor.id},
        )


class FollowDeleteTests(PostsBaseTestCase):
    def test_dono_deixa_de_seguir(self):
        f = Follow.objects.create(follower=self.membro_c1a, followed=self.pastor)
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.delete(reverse("follow-detail", args=[f.id]))
        self.assertEqual(resp.status_code, 204)

    def test_outro_nao_remove_follow_alheio(self):
        # lider_c1a não é o follower → follow nem entra no queryset dele → 404
        f = Follow.objects.create(follower=self.membro_c1a, followed=self.pastor)
        self.client.force_authenticate(user=self.lider_c1a)
        resp = self.client.delete(reverse("follow-detail", args=[f.id]))
        self.assertEqual(resp.status_code, 404)


class FollowNotificationTests(PostsBaseTestCase):
    def test_seguir_gera_notificacao_pro_seguido(self):
        from interactions.models import Notification

        self.client.force_authenticate(user=self.membro_c1a)
        self.client.post(reverse("follow-list"), {"followed": self.pastor.id})
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.pastor, actor=self.membro_c1a, tipo="follow"
            ).exists()
        )
