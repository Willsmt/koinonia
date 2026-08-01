from django.urls import reverse

from interactions.models import Comment
from posts.tests.base import PostsBaseTestCase


def _rows(resp):
    data = resp.data
    if isinstance(data, dict) and "results" in data:  # tolera paginação do ciclo 5
        data = data["results"]
    return data


class CommentScopingTests(PostsBaseTestCase):
    def test_comenta_post_no_escopo(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(
            reverse("comment-list"),
            {"post": self.post_c1a.id, "conteudo": "amém"},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["author"], self.membro_c1a.id)

    def test_comenta_global_qualquer_um(self):
        self.client.force_authenticate(user=self.solto)
        resp = self.client.post(
            reverse("comment-list"),
            {"post": self.post_global.id, "conteudo": "oi"},
        )
        self.assertEqual(resp.status_code, 201)

    def test_nao_comenta_fora_do_escopo(self):
        # membro_c1a não enxerga c1b (mesma rede, outra célula)
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(
            reverse("comment-list"),
            {"post": self.post_c1b.id, "conteudo": "intruso"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Comment.objects.count(), 0)

    def test_solto_nao_comenta_celula(self):
        self.client.force_authenticate(user=self.solto)
        resp = self.client.post(
            reverse("comment-list"),
            {"post": self.post_c1a.id, "conteudo": "intruso"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_comentario_expoe_author_cor(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(
            reverse("comment-list"),
            {"post": self.post_c1a.id, "conteudo": "amém"},
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["author_cor"], "azul")


class CommentReadScopingTests(PostsBaseTestCase):
    def test_nao_lista_comentario_de_post_invisivel(self):
        c = Comment.objects.create(
            post=self.post_c2a, author=self.membro_c2a, conteudo="secreto"
        )
        self.client.force_authenticate(user=self.membro_c1a)  # não lê c2a
        resp = self.client.get(reverse("comment-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn(c.id, {row["id"] for row in _rows(resp)})

    def test_filtro_por_post(self):
        Comment.objects.create(post=self.post_global, author=self.pastor, conteudo="g")
        Comment.objects.create(post=self.post_c1a, author=self.membro_c1a, conteudo="c")
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.get(reverse("comment-list"), {"post": self.post_c1a.id})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(all(row["post"] == self.post_c1a.id for row in _rows(resp)))


class CommentDeleteTests(PostsBaseTestCase):
    def test_autor_apaga_proprio(self):
        c = Comment.objects.create(
            post=self.post_c1a, author=self.membro_c1a, conteudo="meu"
        )
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.delete(reverse("comment-detail", args=[c.id]))
        self.assertEqual(resp.status_code, 204)

    def test_nao_autor_nao_apaga(self):
        # lider_c1a LÊ post_c1a (vê o comentário), mas não é autor → 403
        c = Comment.objects.create(
            post=self.post_c1a, author=self.membro_c1a, conteudo="meu"
        )
        self.client.force_authenticate(user=self.lider_c1a)
        resp = self.client.delete(reverse("comment-detail", args=[c.id]))
        self.assertEqual(resp.status_code, 403)

    def test_sem_edicao(self):
        c = Comment.objects.create(
            post=self.post_c1a, author=self.membro_c1a, conteudo="meu"
        )
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.patch(
            reverse("comment-detail", args=[c.id]), {"conteudo": "editado"}
        )
        self.assertEqual(resp.status_code, 405)


class CommentNotificationTests(PostsBaseTestCase):
    def test_comentar_post_de_outro_gera_notificacao(self):
        from interactions.models import Notification

        self.client.force_authenticate(user=self.lider_c1a)
        self.client.post(
            reverse("comment-list"), {"post": self.post_c1a.id, "conteudo": "bacana"}
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.membro_c1a,
                actor=self.lider_c1a,
                tipo="comment",
                post=self.post_c1a,
            ).exists()
        )

    def test_comentar_proprio_post_nao_gera_notificacao(self):
        from interactions.models import Notification

        self.client.force_authenticate(user=self.membro_c1a)
        self.client.post(
            reverse("comment-list"), {"post": self.post_c1a.id, "conteudo": "bacana"}
        )
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.membro_c1a, actor=self.membro_c1a
            ).exists()
        )
