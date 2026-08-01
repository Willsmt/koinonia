from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from posts.tests.base import PostsBaseTestCase


def _imagem(largura, altura, ruido=False):
    """Gera um arquivo de imagem real (não mock de .size)."""
    buffer = BytesIO()
    if ruido:
        # ruído comprime mal — garante arquivo grande de verdade pro teste de limite
        img = Image.effect_noise((largura, altura), 50).convert("RGB")
    else:
        img = Image.new("RGB", (largura, altura), color=(200, 30, 30))
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile("teste.png", buffer.read(), content_type="image/png")


class ConteudoELimitesTests(PostsBaseTestCase):
    def _postar(self, user, payload, format="json"):
        self.client.force_authenticate(user=user)
        return self.client.post(reverse("post-list"), payload, format=format)

    def test_texto_ate_3000_passa(self):
        resp = self._postar(self.solto, {"escopo": "global", "conteudo": "a" * 3000})
        self.assertEqual(resp.status_code, 201)

    def test_texto_maior_que_3000_da_400(self):
        resp = self._postar(self.solto, {"escopo": "global", "conteudo": "a" * 3001})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("conteudo", resp.data)

    def test_sem_conteudo_e_sem_imagem_da_400(self):
        resp = self._postar(self.solto, {"escopo": "global"})
        self.assertEqual(resp.status_code, 400)

    def test_so_imagem_sem_texto_passa(self):
        imagem = _imagem(10, 10)
        resp = self._postar(self.solto, {"escopo": "global", "imagem": imagem}, format="multipart")
        self.assertEqual(resp.status_code, 201)

    def test_imagem_ate_2mb_passa(self):
        imagem = _imagem(10, 10)
        resp = self._postar(
            self.solto,
            {"escopo": "global", "conteudo": "com foto pequena", "imagem": imagem},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 201)

    def test_imagem_maior_que_2mb_da_400(self):
        imagem = _imagem(2000, 1000, ruido=True)
        self.assertGreater(imagem.size, 2 * 1024 * 1024)  # confere a premissa do teste
        resp = self._postar(
            self.solto,
            {"escopo": "global", "conteudo": "com foto grande", "imagem": imagem},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("imagem", resp.data)
