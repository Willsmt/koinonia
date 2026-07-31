from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
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

    def _imagem_maior_que(self, tamanho_bytes):
        buffer = BytesIO()
        Image.effect_noise((4000, 4000), 200).convert("RGB").save(buffer, format="PNG")
        conteudo = buffer.getvalue()
        self.assertGreater(len(conteudo), tamanho_bytes)
        return SimpleUploadedFile("foto.png", conteudo, content_type="image/png")

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

    def test_update_telefone_normaliza(self):
        self._auth()
        resp = self.client.patch(
            self.url, {"telefone": "(11) 91234-5678"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.telefone, "+5511912345678")

    def test_update_telefone_invalido_400(self):
        self._auth()
        resp = self.client.patch(self.url, {"telefone": "123"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("telefone", resp.data)

    def test_update_mantendo_o_proprio_telefone_nao_da_erro_de_duplicidade(self):
        self.user.telefone = "+5511987654321"
        self.user.save()
        self._auth()
        resp = self.client.patch(
            self.url, {"telefone": "(11) 98765-4321"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_update_foto_maior_que_5mb_400(self):
        self._auth()
        foto = self._imagem_maior_que(5 * 1024 * 1024)
        resp = self.client.patch(self.url, {"foto": foto}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("foto", resp.data)
