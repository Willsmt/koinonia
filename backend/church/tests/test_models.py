from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from church.models import Celula, Membership, Rede

User = get_user_model()


class MembershipConstraintTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.rede = Rede.objects.create(nome="Rede Azul", cor="azul")
        cls.celula = Celula.objects.create(nome="Célula 1", rede=cls.rede)
        cls.user = User.objects.create_user(
            username="ana", password="x", email="ana@t.com"
        )
        cls.outro = User.objects.create_user(
            username="bia", password="x", email="bia@t.com"
        )

    def _viola(self, **kwargs):
        """Espera que salvar dispare IntegrityError da CheckConstraint."""
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Membership.objects.create(**kwargs)

    def test_pastor_sem_escopo_passa(self):
        m = Membership.objects.create(user=self.user, role="pastor")
        self.assertIsNone(m.rede_efetiva)

    def test_pastor_com_celula_viola(self):
        self._viola(user=self.user, role="pastor", celula=self.celula)

    def test_member_sem_celula_viola(self):
        self._viola(user=self.user, role="member")

    def test_member_com_rede_viola(self):
        self._viola(user=self.user, role="member", celula=self.celula, rede=self.rede)

    def test_network_leader_sem_rede_viola(self):
        self._viola(user=self.user, role="network_leader")

    def test_member_rede_efetiva_derivada_da_celula(self):
        m = Membership.objects.create(user=self.user, role="member", celula=self.celula)
        self.assertEqual(m.rede_efetiva, self.rede)

    def test_unique_user_bloqueia_segunda_membership(self):
        Membership.objects.create(user=self.user, role="pastor")
        self._viola(user=self.user, role="member", celula=self.celula)
