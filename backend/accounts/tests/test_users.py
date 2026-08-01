from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

User = get_user_model()


class UserListTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wills = cls._user("wills", nome="Willians Martins", apelido="wills")
        cls.wills2 = cls._user("wills2", nome="Willians Segundo", apelido="segundo")
        cls.patricia = cls._user("patty", nome="Patricia Almeida", apelido="")

    @staticmethod
    def _user(username, nome, apelido):
        return User.objects.create_user(
            username=username,
            email=f"{username}@ex.com",
            password="senha-forte-123",
            nome=nome,
            apelido=apelido,
        )

    def test_anonimo_nao_lista(self):
        resp = self.client.get(reverse("accounts:users"))
        self.assertEqual(resp.status_code, 401)

    def test_autenticado_lista_todos(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"))
        self.assertEqual(resp.status_code, 200)
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual(len(data), 3)

    def test_resposta_nao_vaza_campos_privados(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"))
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        primeiro = data[0]
        self.assertNotIn("email", primeiro)
        self.assertNotIn("telefone", primeiro)
        self.assertNotIn("password", primeiro)
        self.assertIn("nome_exibicao", primeiro)

    def test_busca_por_username(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"), {"search": "wills2"})
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual({u["username"] for u in data}, {"wills2"})

    def test_busca_por_nome(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"), {"search": "Almeida"})
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual({u["username"] for u in data}, {"patty"})

    def test_busca_por_apelido(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"), {"search": "segundo"})
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual({u["username"] for u in data}, {"wills2"})
