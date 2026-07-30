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
