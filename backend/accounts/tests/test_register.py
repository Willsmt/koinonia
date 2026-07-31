from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class RegisterTests(APITestCase):
    def setUp(self):
        self.url = reverse("accounts:register")
        self.payload = {
            "username": "maria",
            "email": "maria@test.com",
            "nome": "Maria Silva",
            "apelido": "Mari",
            "password": "SenhaForte123",
        }

    def test_cadastro_sucesso(self):
        resp = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["user"]["username"], "maria")
        self.assertNotIn("password", resp.data["user"])
        user = User.objects.get(username="maria")
        self.assertTrue(user.check_password("SenhaForte123"))
        self.assertNotEqual(user.password, "SenhaForte123")

    def test_cadastro_username_duplicado(self):
        User.objects.create_user(
            username="maria", email="x@test.com", password="Zxc!2025abc"
        )
        resp = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", resp.data)

    def test_cadastro_email_duplicado(self):
        User.objects.create_user(
            username="outro", email="maria@test.com", password="Zxc!2025abc"
        )
        resp = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", resp.data)

    def test_cadastro_senha_fraca(self):
        resp = self.client.post(
            self.url, {**self.payload, "password": "123"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", resp.data)

    def test_cadastro_telefone_normaliza_e164(self):
        resp = self.client.post(
            self.url, {**self.payload, "telefone": "(11) 98765-4321"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="maria")
        self.assertEqual(user.telefone, "+5511987654321")

    def test_cadastro_telefone_invalido_400(self):
        resp = self.client.post(
            self.url, {**self.payload, "telefone": "123"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("telefone", resp.data)

    def test_cadastro_telefone_duplicado_formato_diferente_400(self):
        User.objects.create_user(
            username="outra",
            email="outra@test.com",
            password="Zxc!2025abc",
            telefone="+5511987654321",
        )
        resp = self.client.post(
            self.url, {**self.payload, "telefone": "11987654321"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("telefone", resp.data)

    def test_cadastro_nome_so_espaco_400(self):
        resp = self.client.post(
            self.url, {**self.payload, "nome": "   "}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nome", resp.data)
