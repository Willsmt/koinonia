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

    def test_expoe_cor_do_escopo(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:users"))
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        alvo = next(u for u in data if u["username"] == "wills")
        self.assertIn("cor", alvo)
        self.assertIsNone(alvo["cor"])  # sem Membership na fixture desta classe


class UserDetailTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.wills = User.objects.create_user(
            username="wills",
            email="wills@ex.com",
            password="senha-forte-123",
            nome="Willians Martins",
        )
        cls.patricia = User.objects.create_user(
            username="patty",
            email="patty@ex.com",
            password="senha-forte-123",
            nome="Patricia Almeida",
        )

    def test_anonimo_nao_acessa_detail(self):
        resp = self.client.get(reverse("accounts:user-detail", args=[self.patricia.id]))
        self.assertEqual(resp.status_code, 401)

    def test_autenticado_ve_perfil_de_outro(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:user-detail", args=[self.patricia.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["username"], "patty")
        self.assertNotIn("email", resp.data)

    def test_detail_404_pra_id_inexistente(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:user-detail", args=[99999]))
        self.assertEqual(resp.status_code, 404)

    def test_detail_expoe_cor(self):
        self.client.force_authenticate(user=self.wills)
        resp = self.client.get(reverse("accounts:user-detail", args=[self.patricia.id]))
        self.assertIn("cor", resp.data)
        self.assertIsNone(resp.data["cor"])
