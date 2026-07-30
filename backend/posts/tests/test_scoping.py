from django.urls import reverse

from posts.tests.base import PostsBaseTestCase


class ScopingLeituraTests(PostsBaseTestCase):
    def test_membro_ve_propria_celula_rede_e_global(self):
        ids = self._ids_do_feed(self.membro_c1a)
        self.assertEqual(ids, {self.post_global.id, self.post_c1a.id, self.post_r1.id})

    def test_cell_leader_ve_todas_celulas_da_sua_rede(self):
        ids = self._ids_do_feed(self.lider_c1a)
        self.assertEqual(
            ids,
            {self.post_global.id, self.post_c1a.id, self.post_c1b.id, self.post_r1.id},
        )
        self.assertNotIn(self.post_c2a.id, ids)  # célula de outra rede
        self.assertNotIn(self.post_r2.id, ids)

    def test_network_leader_ve_tudo_cross_rede(self):
        # consequência aceita: mesmo conjunto que o pastor
        self.assertEqual(self._ids_do_feed(self.lider_r1), self._todos_os_ids())

    def test_pastor_ve_tudo(self):
        self.assertEqual(self._ids_do_feed(self.pastor), self._todos_os_ids())

    def test_solto_ve_so_global(self):
        self.assertEqual(self._ids_do_feed(self.solto), {self.post_global.id})

    def test_retrieve_fora_de_escopo_da_404(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("post-detail", args=[self.post_c2a.id]))
        self.assertEqual(resp.status_code, 404)  # nem enxerga → 404, não 403

    def test_retrieve_dentro_do_escopo_ok(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("post-detail", args=[self.post_c1a.id]))
        self.assertEqual(resp.status_code, 200)
