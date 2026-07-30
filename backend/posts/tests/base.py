from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from church.models import Celula, Membership, Rede
from posts.models import Post

User = get_user_model()


class PostsBaseTestCase(APITestCase):
    """Grafo de igreja + posts semeados, base dos testes de posts.

        R1 (azul)   ── C1a, C1b
        R2 (branca) ── C2a

    Users: membro_c1a, lider_c1a (cell_leader), lider_r1 (network_leader),
    pastor, membro_c2a (prova isolamento cross-rede), solto (sem Membership).
    """

    @classmethod
    def setUpTestData(cls):
        cls.r1 = Rede.objects.create(nome="Rede Azul", cor="azul")
        cls.r2 = Rede.objects.create(nome="Rede Branca", cor="branca")
        cls.c1a = Celula.objects.create(nome="C1a", rede=cls.r1)
        cls.c1b = Celula.objects.create(nome="C1b", rede=cls.r1)
        cls.c2a = Celula.objects.create(nome="C2a", rede=cls.r2)

        cls.membro_c1a = cls._user("membro_c1a")
        Membership.objects.create(user=cls.membro_c1a, role="member", celula=cls.c1a)

        cls.lider_c1a = cls._user("lider_c1a")
        Membership.objects.create(
            user=cls.lider_c1a, role="cell_leader", celula=cls.c1a
        )

        cls.lider_r1 = cls._user("lider_r1")
        Membership.objects.create(user=cls.lider_r1, role="network_leader", rede=cls.r1)

        cls.pastor = cls._user("pastor")
        Membership.objects.create(user=cls.pastor, role="pastor")

        cls.membro_c2a = cls._user("membro_c2a")
        Membership.objects.create(user=cls.membro_c2a, role="member", celula=cls.c2a)

        cls.solto = cls._user("solto")  # sem Membership

        # posts semeados via ORM (bypassa o serializer de propósito:
        # aqui só preciso de conteúdo em cada escopo/alvo pra testar LEITURA)
        cls.post_global = Post.objects.create(
            author=cls.pastor, escopo="global", conteudo="global"
        )
        cls.post_c1a = Post.objects.create(
            author=cls.membro_c1a, escopo="celula", celula=cls.c1a, conteudo="c1a"
        )
        cls.post_c1b = Post.objects.create(
            author=cls.lider_c1a, escopo="celula", celula=cls.c1b, conteudo="c1b"
        )
        cls.post_c2a = Post.objects.create(
            author=cls.membro_c2a, escopo="celula", celula=cls.c2a, conteudo="c2a"
        )
        cls.post_r1 = Post.objects.create(
            author=cls.lider_r1, escopo="rede", rede=cls.r1, conteudo="r1"
        )
        cls.post_r2 = Post.objects.create(
            author=cls.pastor, escopo="rede", rede=cls.r2, conteudo="r2"
        )

    @staticmethod
    def _user(username):
        return User.objects.create_user(
            username=username,
            email=f"{username}@ex.com",  # unique: email distinto por user
            password="senha-forte-123",
            nome=username.replace("_", " ").title(),
        )

    def _ids_do_feed(self, user):
        self.client.force_authenticate(user=user)
        resp = self.client.get(reverse("post-list"))
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        if isinstance(data, dict) and "results" in data:  # tolera paginação futura
            data = data["results"]
        return {p["id"] for p in data}

    def _todos_os_ids(self):
        return {
            self.post_global.id,
            self.post_c1a.id,
            self.post_c1b.id,
            self.post_c2a.id,
            self.post_r1.id,
            self.post_r2.id,
        }
