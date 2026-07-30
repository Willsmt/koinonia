from django.contrib.auth import get_user_model
from django.test import TestCase

from church.models import Celula, Rede
from church.serializers import MembershipSerializer

User = get_user_model()


class MembershipSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.rede = Rede.objects.create(nome="Rede Azul", cor="azul")
        cls.celula = Celula.objects.create(nome="Célula 1", rede=cls.rede)
        cls.user = User.objects.create_user(username="ana", password="x")

    def test_member_com_celula_valido(self):
        s = MembershipSerializer(
            data={"user": self.user.id, "role": "member", "celula": self.celula.id}
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_member_sem_celula_invalido(self):
        s = MembershipSerializer(data={"user": self.user.id, "role": "member"})
        self.assertFalse(s.is_valid())
        self.assertIn("celula", s.errors)

    def test_pastor_com_celula_invalido(self):
        s = MembershipSerializer(
            data={"user": self.user.id, "role": "pastor", "celula": self.celula.id}
        )
        self.assertFalse(s.is_valid())

    def test_network_leader_com_celula_invalido(self):
        s = MembershipSerializer(
            data={
                "user": self.user.id,
                "role": "network_leader",
                "celula": self.celula.id,
            }
        )
        self.assertFalse(s.is_valid())