from django.test import TestCase

from accounts.models import User


class NomeExibicaoTests(TestCase):
    def test_usa_apelido_quando_tem(self):
        u = User(username="x", nome="Fulano de Tal", apelido="Fu")
        self.assertEqual(u.nome_exibicao, "Fu")

    def test_cai_no_nome_sem_apelido(self):
        u = User(username="y", nome="Fulano de Tal", apelido="")
        self.assertEqual(u.nome_exibicao, "Fulano de Tal")
