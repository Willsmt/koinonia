from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from church.models import Celula, Membership, Rede
from posts.models import Post

User = get_user_model()


class DashboardStatsTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.r1 = Rede.objects.create(nome="Rede Azul", cor="#2563eb")
        cls.r2 = Rede.objects.create(nome="Rede Branca", cor="#94a3b8")
        cls.c1a = Celula.objects.create(nome="C1a", rede=cls.r1)
        cls.c1b = Celula.objects.create(nome="C1b", rede=cls.r1)
        cls.c2a = Celula.objects.create(nome="C2a", rede=cls.r2)

        cls.pastor = cls._user("pastor")
        Membership.objects.create(user=cls.pastor, role="pastor")

        cls.lider_r1 = cls._user("lider_r1")
        Membership.objects.create(user=cls.lider_r1, role="network_leader", rede=cls.r1)

        cls.lider_c1a = cls._user("lider_c1a")
        Membership.objects.create(
            user=cls.lider_c1a, role="cell_leader", celula=cls.c1a
        )

        cls.membro_c1a = cls._user("membro_c1a")
        Membership.objects.create(user=cls.membro_c1a, role="member", celula=cls.c1a)

        cls.membro_c1b = cls._user("membro_c1b")
        Membership.objects.create(user=cls.membro_c1b, role="member", celula=cls.c1b)

        cls.membro_c2a = cls._user("membro_c2a")
        Membership.objects.create(user=cls.membro_c2a, role="member", celula=cls.c2a)

        cls.solto = cls._user("solto")

        # posts espalhados pelos 3 escopos, em células/redes diferentes
        Post.objects.create(
            author=cls.membro_c1a, escopo="celula", celula=cls.c1a, conteudo="c1a-1"
        )
        Post.objects.create(
            author=cls.membro_c1a, escopo="celula", celula=cls.c1a, conteudo="c1a-2"
        )
        Post.objects.create(
            author=cls.membro_c1b, escopo="celula", celula=cls.c1b, conteudo="c1b-1"
        )
        Post.objects.create(
            author=cls.membro_c2a, escopo="celula", celula=cls.c2a, conteudo="c2a-1"
        )
        Post.objects.create(
            author=cls.lider_r1, escopo="rede", rede=cls.r1, conteudo="r1-1"
        )
        Post.objects.create(author=cls.pastor, escopo="global", conteudo="g-1")

    @staticmethod
    def _user(username):
        return User.objects.create_user(
            username=username, email=f"{username}@ex.com", password="x", nome=username
        )

    def test_anonimo_401(self):
        resp = self.client.get(reverse("dashboard-stats"))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_membro_comum_403(self):
        self.client.force_authenticate(self.membro_c1a)
        resp = self.client.get(reverse("dashboard-stats"))
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_pastor_ve_tudo(self):
        self.client.force_authenticate(self.pastor)
        resp = self.client.get(reverse("dashboard-stats"))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["escopo"], "pastor")
        self.assertEqual(resp.data["total_membros"], 6)  # todos os Membership criados
        nomes_celulas = {c["nome"] for c in resp.data["membros_por_celula"]}
        self.assertEqual(nomes_celulas, {"C1a", "C1b", "C2a"})
        self.assertEqual(
            resp.data["posts_por_escopo"], {"global": 1, "rede": 1, "celula": 4}
        )

    def test_lider_de_rede_ve_so_a_propria_rede(self):
        self.client.force_authenticate(self.lider_r1)
        resp = self.client.get(reverse("dashboard-stats"))
        self.assertEqual(resp.status_code, 200)
        nomes_celulas = {c["nome"] for c in resp.data["membros_por_celula"]}
        self.assertEqual(nomes_celulas, {"C1a", "C1b"})  # não vê C2a (rede 2)
        # posts: celula (c1a+c1b = 3) + rede (r1 = 1), sem global nem posts da rede 2
        self.assertEqual(resp.data["posts_por_escopo"]["celula"], 3)
        self.assertEqual(resp.data["posts_por_escopo"]["rede"], 1)
        self.assertEqual(resp.data["posts_por_escopo"]["global"], 0)

    def test_lider_de_celula_ve_so_a_propria_celula(self):
        self.client.force_authenticate(self.lider_c1a)
        resp = self.client.get(reverse("dashboard-stats"))
        self.assertEqual(resp.status_code, 200)
        nomes_celulas = {c["nome"] for c in resp.data["membros_por_celula"]}
        self.assertEqual(nomes_celulas, {"C1a"})
        self.assertEqual(
            resp.data["posts_por_escopo"]["celula"], 2
        )  # só os 2 posts de c1a
        self.assertEqual(resp.data["celula_mais_ativa"]["nome"], "C1a")
