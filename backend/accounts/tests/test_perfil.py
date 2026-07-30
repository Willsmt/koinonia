from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.models import User


class PerfilTests(APITestCase):
    def setUp(self):
        self.url = reverse("accounts:me")
        self.user = User.objects.create_user(
            username="ana",
            email="ana@test.com",
            password="SenhaForte123",
            nome="Ana Souza",
            apelido="Aninha",
        )
        self.token = Token.objects.create(user=self.user)

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_me_sem_token_401(self):
        self.assertEqual(
            self.client.get(self.url).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_me_com_token_dados_certos(self):
        self._auth()
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "ana")
        self.assertEqual(resp.data["nome_exibicao"], "Aninha")
        self.assertNotIn("password", resp.data)

    def test_perfil_update_bio(self):
        self._auth()
        resp = self.client.patch(self.url, {"bio": "servo"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.bio, "servo")

    def test_username_read_only(self):
        self._auth()
        self.client.patch(self.url, {"username": "hacker"}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "ana")
