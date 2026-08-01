from django.urls import reverse

from interactions.models import Like
from posts.tests.base import PostsBaseTestCase


class LikeScopingTests(PostsBaseTestCase):
    def test_curte_post_no_escopo(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(reverse("like-list"), {"post": self.post_c1a.id})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["user"], self.membro_c1a.id)

    def test_nao_curte_fora_do_escopo(self):
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.post(reverse("like-list"), {"post": self.post_c2a.id})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Like.objects.count(), 0)


class LikeUniqueTests(PostsBaseTestCase):
    def test_curtida_dupla_bloqueada(self):
        self.client.force_authenticate(user=self.membro_c1a)
        url = reverse("like-list")
        self.assertEqual(
            self.client.post(url, {"post": self.post_c1a.id}).status_code, 201
        )
        r2 = self.client.post(url, {"post": self.post_c1a.id})
        self.assertEqual(r2.status_code, 400)
        self.assertEqual(Like.objects.filter(post=self.post_c1a).count(), 1)


class LikeDeleteTests(PostsBaseTestCase):
    def test_dono_descurte(self):
        like = Like.objects.create(post=self.post_c1a, user=self.membro_c1a)
        self.client.force_authenticate(user=self.membro_c1a)
        resp = self.client.delete(reverse("like-detail", args=[like.id]))
        self.assertEqual(resp.status_code, 204)

    def test_outro_nao_descurte(self):
        # lider_c1a lê o post e vê o like, mas não é o dono → 403
        like = Like.objects.create(post=self.post_c1a, user=self.membro_c1a)
        self.client.force_authenticate(user=self.lider_c1a)
        resp = self.client.delete(reverse("like-detail", args=[like.id]))
        self.assertEqual(resp.status_code, 403)


class LikeNotificationTests(PostsBaseTestCase):
    def test_curtir_post_de_outro_gera_notificacao(self):
        from interactions.models import Notification

        self.client.force_authenticate(user=self.lider_c1a)
        self.client.post(reverse("like-list"), {"post": self.post_c1a.id})
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.membro_c1a,
                actor=self.lider_c1a,
                tipo="like",
                post=self.post_c1a,
            ).exists()
        )

    def test_curtir_proprio_post_nao_gera_notificacao(self):
        from interactions.models import Notification

        self.client.force_authenticate(user=self.membro_c1a)
        self.client.post(reverse("like-list"), {"post": self.post_c1a.id})
        self.assertFalse(
            Notification.objects.filter(
                recipient=self.membro_c1a, actor=self.membro_c1a
            ).exists()
        )
