from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from church.models import Membership
from reports.models import BugReport

User = get_user_model()


def _imagem(largura, altura, ruido=False):
    buffer = BytesIO()
    if ruido:
        img = Image.effect_noise((largura, altura), 50).convert("RGB")
    else:
        img = Image.new("RGB", (largura, altura), color=(10, 10, 10))
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile("bug.png", buffer.read(), content_type="image/png")


class BugReportTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.pastor = User.objects.create_user(
            username="pastor", password="x", email="pastor@t.com"
        )
        Membership.objects.create(user=cls.pastor, role="pastor")

        cls.membro = User.objects.create_user(
            username="membro", password="x", email="membro@t.com"
        )

    def test_anonimo_nao_reporta(self):
        resp = self.client.post(reverse("bugreport-list"), {"descricao": "bug"})
        self.assertEqual(resp.status_code, 401)

    def test_autenticado_reporta(self):
        self.client.force_authenticate(self.membro)
        resp = self.client.post(reverse("bugreport-list"), {"descricao": "botão quebrado", "pagina": "/perfil"})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["reporter"], self.membro.id)

    def test_membro_nao_le_lista(self):
        self.client.force_authenticate(self.membro)
        resp = self.client.get(reverse("bugreport-list"))
        self.assertEqual(resp.status_code, 403)

    def test_pastor_le_lista(self):
        BugReport.objects.create(reporter=self.membro, descricao="bug antigo")
        self.client.force_authenticate(self.pastor)
        resp = self.client.get(reverse("bugreport-list"))
        self.assertEqual(resp.status_code, 200)
        data = resp.data["results"] if isinstance(resp.data, dict) else resp.data
        self.assertEqual(len(data), 1)

    def test_imagem_ate_2mb_passa(self):
        self.client.force_authenticate(self.membro)
        resp = self.client.post(
            reverse("bugreport-list"),
            {"descricao": "com print", "imagem": _imagem(10, 10)},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)

    def test_imagem_maior_que_2mb_da_400(self):
        self.client.force_authenticate(self.membro)
        imagem = _imagem(2000, 1000, ruido=True)
        self.assertGreater(imagem.size, 2 * 1024 * 1024)
        resp = self.client.post(
            reverse("bugreport-list"),
            {"descricao": "com print grande", "imagem": imagem},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("imagem", resp.data)

    def test_descricao_muito_longa_da_400(self):
        self.client.force_authenticate(self.membro)
        resp = self.client.post(reverse("bugreport-list"), {"descricao": "a" * 2001})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("descricao", resp.data)
