from django.urls import reverse

from posts.tests.base import PostsBaseTestCase


class AuthorCorTests(PostsBaseTestCase):
    def test_post_de_pastor_expoe_cor_pastor(self):
        self.client.force_authenticate(user=self.pastor)
        resp = self.client.get(reverse("post-detail", args=[self.post_global.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["author_cor"], "pastor")

    def test_post_de_membro_expoe_cor_da_celula(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("post-detail", args=[self.post_c1a.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["author_cor"], "#2563eb")

    def test_post_de_lider_rede_expoe_cor_da_rede(self):
        self.client.force_authenticate(user=self.lider_r1)
        resp = self.client.get(reverse("post-detail", args=[self.post_r1.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["author_cor"], "#2563eb")

    def test_post_de_membro_em_outra_rede_expoe_cor_diferente(self):
        self.client.force_authenticate(user=self.membro_c2a)
        resp = self.client.get(reverse("post-detail", args=[self.post_c2a.id]))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["author_cor"], "#94a3b8")
