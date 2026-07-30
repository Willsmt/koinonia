from django.urls import reverse

from posts.tests.base import PostsBaseTestCase


class EdicaoExclusaoTests(PostsBaseTestCase):
    def test_put_bloqueado(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.put(
            reverse("post-detail", args=[self.post_c1a.id]),
            {"escopo": "global", "conteudo": "editado"},
            format="json",
        )
        self.assertEqual(resp.status_code, 405)  # método cortado na ViewSet

    def test_patch_bloqueado(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.patch(
            reverse("post-detail", args=[self.post_c1a.id]),
            {"conteudo": "editado"},
            format="json",
        )
        self.assertEqual(resp.status_code, 405)

    def test_autor_deleta_o_proprio_post(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.delete(reverse("post-detail", args=[self.post_c1a.id]))
        self.assertEqual(resp.status_code, 204)

    def test_nao_autor_no_escopo_leva_403(self):
        # lider_c1a enxerga o post de c1a (mesma rede) mas não é o autor
        self.client.force_authenticate(user=self.lider_c1a)
        resp = self.client.delete(reverse("post-detail", args=[self.post_c1a.id]))
        self.assertEqual(resp.status_code, 403)

    def test_fora_do_escopo_leva_404_nao_403(self):
        # membro_c1a nem enxerga o post de c2a → 404 no queryset, antes da permission
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.delete(reverse("post-detail", args=[self.post_c2a.id]))
        self.assertEqual(resp.status_code, 404)
