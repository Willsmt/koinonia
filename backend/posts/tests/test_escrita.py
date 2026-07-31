from django.urls import reverse

from posts.tests.base import PostsBaseTestCase


class EscritaPermissaoTests(PostsBaseTestCase):
    def _postar(self, user, payload):
        self.client.force_authenticate(user=user)
        return self.client.post(reverse("post-list"), payload, format="json")

    # --- célula ---
    def test_membro_posta_na_propria_celula(self):
        resp = self._postar(
            self.membro_c1a,
            {"escopo": "celula", "celula": self.c1a.id, "conteudo": "oi c1a"},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["author"], self.membro_c1a.id)  # carimbado no server

    def test_membro_nao_posta_em_celula_alheia(self):
        resp = self._postar(
            self.membro_c1a,
            {"escopo": "celula", "celula": self.c1b.id, "conteudo": "invadindo"},
        )
        self.assertEqual(resp.status_code, 403)

    def test_lider_de_celula_nao_posta_em_celula_alheia(self):
        resp = self._postar(
            self.lider_c1a,
            {"escopo": "celula", "celula": self.c1b.id, "conteudo": "invadindo"},
        )
        self.assertEqual(resp.status_code, 403)

    def test_pastor_posta_em_qualquer_celula(self):
        resp = self._postar(
            self.pastor,
            {"escopo": "celula", "celula": self.c1a.id, "conteudo": "pastor na c1a"},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["author"], self.pastor.id)

    def test_membro_nao_posta_na_rede(self):
        resp = self._postar(
            self.membro_c1a,
            {"escopo": "rede", "rede": self.r1.id, "conteudo": "canal da liderança"},
        )
        self.assertEqual(resp.status_code, 403)

    # --- rede ---
    def test_network_leader_posta_na_propria_rede(self):
        resp = self._postar(
            self.lider_r1,
            {"escopo": "rede", "rede": self.r1.id, "conteudo": "aviso r1"},
        )
        self.assertEqual(resp.status_code, 201)

    def test_network_leader_nao_posta_em_rede_alheia(self):
        resp = self._postar(
            self.lider_r1,
            {"escopo": "rede", "rede": self.r2.id, "conteudo": "aviso r2"},
        )
        self.assertEqual(resp.status_code, 403)

    def test_pastor_posta_em_qualquer_rede(self):
        resp = self._postar(
            self.pastor,
            {"escopo": "rede", "rede": self.r2.id, "conteudo": "pastor na r2"},
        )
        self.assertEqual(resp.status_code, 201)

    # --- global ---
    def test_solto_posta_global(self):
        resp = self._postar(self.solto, {"escopo": "global", "conteudo": "oi igreja"})
        self.assertEqual(resp.status_code, 201)

    # --- estrutura (400, não 403) ---
    def test_celula_sem_alvo_da_400(self):
        resp = self._postar(
            self.membro_c1a, {"escopo": "celula", "conteudo": "sem célula"}
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("celula", resp.data)

    def test_rede_com_celula_junto_da_400(self):
        resp = self._postar(
            self.lider_r1,
            {
                "escopo": "rede",
                "rede": self.r1.id,
                "celula": self.c1a.id,
                "conteudo": "os dois alvos",
            },
        )
        self.assertEqual(resp.status_code, 400)

    def test_anonimo_nao_posta(self):
        resp = self.client.post(
            reverse("post-list"),
            {"escopo": "global", "conteudo": "sem login"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)
