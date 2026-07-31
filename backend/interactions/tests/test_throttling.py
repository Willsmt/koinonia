from unittest import mock

from django.core.cache import cache
from django.urls import reverse
from rest_framework.throttling import ScopedRateThrottle

from posts.models import Post
from posts.tests.base import PostsBaseTestCase


# O DEFAULT_THROTTLE_RATES é lido no import da classe e congela como atributo
# de classe — override_settings(REST_FRAMEWORK=...) NÃO alcança ele. Por isso
# patchamos o dict direto: baixa interactions_write pra 3/min só neste teste
# (o 4º create toma 429), com restauração automática no fim.
@mock.patch.dict(
    ScopedRateThrottle.THROTTLE_RATES,
    {"interactions_write": "3/min"},
)
class InteractionsWriteThrottleTests(PostsBaseTestCase):
    def setUp(self):
        super().setUp()
        # Contador de throttle vive no cache; limpa pra não vazar entre casos.
        cache.clear()
        self.client.force_authenticate(user=self.membro_c1a)

    def test_create_trava_no_limite(self):
        # 3 curtidas passam (posts distintos, pra não bater no unique antes do
        # throttle); a 4ª toma 429.
        url = reverse("like-list")
        posts_ok = [
            self.post_c1a,
            Post.objects.create(author=self.membro_c1a, escopo="global", conteudo="p2"),
            Post.objects.create(author=self.membro_c1a, escopo="global", conteudo="p3"),
        ]
        for post in posts_ok:
            resp = self.client.post(url, {"post": post.id})
            self.assertEqual(resp.status_code, 201, resp.data)

        p4 = Post.objects.create(author=self.membro_c1a, escopo="global", conteudo="p4")
        resp = self.client.post(url, {"post": p4.id})
        self.assertEqual(resp.status_code, 429)

    def test_list_nao_trava(self):
        # Muitos GET no list não disparam o freio de create: prova que o
        # get_throttles() isolou o escopo só na criação.
        url = reverse("like-list")
        for _ in range(10):
            resp = self.client.get(url)
            self.assertEqual(resp.status_code, 200)
