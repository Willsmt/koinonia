from django.urls import reverse

from posts.tests.base import PostsBaseTestCase


class PostedAsTests(PostsBaseTestCase):
    def _postar(self, user, payload):
        self.client.force_authenticate(user=user)
        return self.client.post(reverse("post-list"), payload, format="json")

    def test_cell_leader_posta_como_a_celula(self):
        resp = self._postar(
            self.lider_c1a,
            {
                "escopo": "celula",
                "celula": self.c1a.id,
                "posted_as": self.c1a.id,
                "conteudo": "aviso da célula",
            },
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["posted_as"], self.c1a.id)
        self.assertEqual(
            resp.data["author"], self.lider_c1a.id
        )  # author real preservado

    def test_membro_nao_usa_posted_as(self):
        resp = self._postar(
            self.membro_c1a,
            {
                "escopo": "celula",
                "celula": self.c1a.id,
                "posted_as": self.c1a.id,
                "conteudo": "fingindo ser a célula",
            },
        )
        self.assertEqual(resp.status_code, 403)  # não é líder

    def test_posted_as_em_global_da_400(self):
        resp = self._postar(
            self.lider_c1a,
            {"escopo": "global", "posted_as": self.c1a.id, "conteudo": "x"},
        )
        self.assertEqual(resp.status_code, 400)  # estrutural: posted_as só em célula

    def test_lider_nao_assina_como_outra_celula(self):
        # líder de C1a tentando postar em C1b assinando como C1b:
        # ele nem pertence a C1b (celula_id != c1b) → barra já na escrita
        resp = self._postar(
            self.lider_c1a,
            {
                "escopo": "celula",
                "celula": self.c1b.id,
                "posted_as": self.c1b.id,
                "conteudo": "célula que não é minha",
            },
        )
        self.assertEqual(resp.status_code, 403)
