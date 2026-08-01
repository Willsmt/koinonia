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
        cls.rede2 = Rede.objects.create(nome="Rede Branca", cor="branca")
        cls.celula2 = Celula.objects.create(nome="Célula 2", rede=cls.rede2)

        cls.pastor = User.objects.create_user(
            username="pastor", password="x", email="pastor@t.com"
        )
        Membership.objects.create(user=cls.pastor, role="pastor")

        cls.lider_celula = User.objects.create_user(
            username="lc", password="x", email="lc@t.com"
        )
        Membership.objects.create(
            user=cls.lider_celula, role="cell_leader", celula=cls.celula
        )

        cls.lider_rede = User.objects.create_user(
            username="lr", password="x", email="lr@t.com"
        )
        Membership.objects.create(user=cls.lider_rede, role="network_leader", rede=cls.rede)

        cls.sem_role = User.objects.create_user(
            username="solto", password="x", email="solto@t.com"
        )

    def test_pastor_cria_rede(self):
        self.client.force_authenticate(self.pastor)
        r = self.client.post("/api/church/redes/", {"nome": "Nova", "cor": "cinza"})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_lider_celula_nao_cria_rede(self):
        self.client.force_authenticate(self.lider_celula)
        r = self.client.post("/api/church/redes/", {"nome": "Nova", "cor": "cinza"})
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
        novo = User.objects.create_user(
            username="novo", password="x", email="novo1@t.com"
        )
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula.id},
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_sem_role_nao_adiciona_membership(self):
        self.client.force_authenticate(self.sem_role)
        novo = User.objects.create_user(
            username="novo", password="x", email="novo2@t.com"
        )
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula.id},
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    # --- escalonamento de privilégio: quem pode ATRIBUIR qual role ---

    def test_lider_celula_nao_promove_pra_pastor(self):
        self.client.force_authenticate(self.lider_celula)
        novo = User.objects.create_user(username="novo3", password="x", email="novo3@t.com")
        r = self.client.post("/api/church/memberships/", {"user": novo.id, "role": "pastor"})
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_celula_nao_adiciona_em_celula_alheia(self):
        self.client.force_authenticate(self.lider_celula)
        novo = User.objects.create_user(username="novo4", password="x", email="novo4@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula2.id},
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_rede_promove_lider_de_celula_na_propria_rede(self):
        self.client.force_authenticate(self.lider_rede)
        novo = User.objects.create_user(username="novo5", password="x", email="novo5@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "cell_leader", "celula": self.celula.id},
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_lider_rede_nao_promove_pra_network_leader(self):
        self.client.force_authenticate(self.lider_rede)
        novo = User.objects.create_user(username="novo6", password="x", email="novo6@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "network_leader", "rede": self.rede.id},
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_rede_nao_mexe_em_celula_de_outra_rede(self):
        self.client.force_authenticate(self.lider_rede)
        novo = User.objects.create_user(username="novo7", password="x", email="novo7@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "member", "celula": self.celula2.id},
        )
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_pastor_atribui_qualquer_role(self):
        self.client.force_authenticate(self.pastor)
        novo = User.objects.create_user(username="novo8", password="x", email="novo8@t.com")
        r = self.client.post(
            "/api/church/memberships/",
            {"user": novo.id, "role": "network_leader", "rede": self.rede2.id},
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    # --- object-level: quem pode EDITAR/DELETAR qual Membership existente ---

    def test_lider_celula_nao_deleta_membership_de_celula_alheia(self):
        membro = User.objects.create_user(username="mo1", password="x", email="mo1@t.com")
        m = Membership.objects.create(user=membro, role="member", celula=self.celula2)
        self.client.force_authenticate(self.lider_celula)
        r = self.client.delete(f"/api/church/memberships/{m.id}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_celula_nao_deleta_membership_do_pastor(self):
        self.client.force_authenticate(self.lider_celula)
        r = self.client.delete(f"/api/church/memberships/{self.pastor.membership.id}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_celula_deleta_membro_da_propria_celula(self):
        membro = User.objects.create_user(username="mprop", password="x", email="mprop@t.com")
        m = Membership.objects.create(user=membro, role="member", celula=self.celula)
        self.client.force_authenticate(self.lider_celula)
        r = self.client.delete(f"/api/church/memberships/{m.id}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_lider_celula_nao_deleta_outro_lider_mesmo_na_propria_celula(self):
        outro_lider = User.objects.create_user(username="outrolider", password="x", email="outrolider@t.com")
        m = Membership.objects.create(user=outro_lider, role="cell_leader", celula=self.celula)
        self.client.force_authenticate(self.lider_celula)
        r = self.client.delete(f"/api/church/memberships/{m.id}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_lider_rede_deleta_lider_de_celula_da_propria_rede(self):
        lc = User.objects.create_user(username="lc2", password="x", email="lc2@t.com")
        m = Membership.objects.create(user=lc, role="cell_leader", celula=self.celula)
        self.client.force_authenticate(self.lider_rede)
        r = self.client.delete(f"/api/church/memberships/{m.id}/")
        self.assertEqual(r.status_code, status.HTTP_204_NO_CONTENT)

    def test_lider_rede_nao_deleta_membership_de_outra_rede(self):
        membro = User.objects.create_user(username="mo2", password="x", email="mo2@t.com")
        m = Membership.objects.create(user=membro, role="member", celula=self.celula2)
        self.client.force_authenticate(self.lider_rede)
        r = self.client.delete(f"/api/church/memberships/{m.id}/")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
