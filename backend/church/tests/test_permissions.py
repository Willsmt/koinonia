from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from church.models import Celula, Membership, Rede

User = get_user_model()


class RedePermissionTest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.rede = Rede.objects.create(nome="Rede Azul", cor="azul")
        cls.celula = Celula.objects.create(nome="Célula 1", rede=cls.rede)

        cls.pastor = User.objects.create_user(username="pastor", password="x", email="pastor@t.com")
        Membership.objects.create(user=cls.pastor, role="pastor")

        cls.lider_celula = User.objects.create_user(username="lc", password="x", email="lc@t.com")
        Membership.objects.create(
            user=cls.lider_celula, role="cell_leader", celula=cls.celula
        )

        cls.sem_role = User.objects.create_user(username="solto", password="x", email="solto@t.com")

    def test_pastor_cria_rede(self):
        self.client.force_authenticate(self.pastor)
        r = self.client.post(
            "/api/church/redes/", {"nome": "Nova", "cor": "cinza"}
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_lider_celula_nao_cria_rede(self):
        self.client.force_authenticate(self.lider_celula)
        r = self.client.post(
            "/api/church/redes/", {"nome": "Nova", "cor": "cinza"}
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonimo_nao_le(self):
        r = self.client.get("/api/church/redes/")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_autenticado_le(self):
        self.client.force_authenticate(self.sem_role)
        r = self.client.get("/api/church/redes/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_lider_celula_adiciona_membership(self):
        self.client.force_authenticate(self.lider_celula)
        novo = User.objects.create_user(username="novo", password="x", email="novo1@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula.id},
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_sem_role_nao_adiciona_membership(self):
        self.client.force_authenticate(self.sem_role)
        novo = User.objects.create_user(username="novo", password="x", email="novo2@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula.id},
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)