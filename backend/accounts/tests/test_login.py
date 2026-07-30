from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class LoginTests(APITestCase):
    def setUp(self):
        self.url = reverse("accounts:login")
        User.objects.create_user(
            username="joao",
            email="joao@test.com",
            password="SenhaForte123",
            nome="João",
        )

    def test_login_sucesso(self):
        resp = self.client.post(
            self.url, {"username": "joao", "password": "SenhaForte123"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("token", resp.data)

    def test_login_senha_errada(self):
        resp = self.client.post(
            self.url, {"username": "joao", "password": "errada"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
