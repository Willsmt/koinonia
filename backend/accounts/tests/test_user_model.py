from django.test import TestCase

from accounts.models import User
from church.models import Celula, Membership, Rede


class NomeExibicaoTests(TestCase):
    def test_usa_apelido_quando_tem(self):
        u = User(username="x", nome="Fulano de Tal", apelido="Fu")
        self.assertEqual(u.nome_exibicao, "Fu")

    def test_cai_no_nome_sem_apelido(self):
        u = User(username="y", nome="Fulano de Tal", apelido="")
        self.assertEqual(u.nome_exibicao, "Fulano de Tal")


class CorEscopoTests(TestCase):
    def test_sem_membership_retorna_none(self):
        u = User.objects.create_user(
            username="solto",
            email="solto@ex.com",
            password="senha-forte-123",
            nome="Solto",
        )
        self.assertIsNone(u.cor_escopo)

    def test_pastor_retorna_sentinela(self):
        u = User.objects.create_user(
            username="pastor",
            email="pastor@ex.com",
            password="senha-forte-123",
            nome="Pastor",
        )
        Membership.objects.create(user=u, role="pastor")
        self.assertEqual(u.cor_escopo, "pastor")

    def test_member_retorna_cor_da_celula(self):
        rede = Rede.objects.create(nome="Rede Azul", cor="#2563eb")
        celula = Celula.objects.create(nome="C1", rede=rede)
        u = User.objects.create_user(
            username="membro",
            email="membro@ex.com",
            password="senha-forte-123",
            nome="Membro",
        )
        Membership.objects.create(user=u, role="member", celula=celula)
        self.assertEqual(u.cor_escopo, "#2563eb")

    def test_network_leader_retorna_cor_da_rede(self):
        rede = Rede.objects.create(nome="Rede Branca", cor="#94a3b8")
        u = User.objects.create_user(
            username="lider_rede",
            email="lider_rede@ex.com",
            password="senha-forte-123",
            nome="Lider Rede",
        )
        Membership.objects.create(user=u, role="network_leader", rede=rede)
        self.assertEqual(u.cor_escopo, "#94a3b8")
