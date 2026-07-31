from unittest import mock

from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from accounts.models import User


# THROTTLE_RATES é atributo de classe congelado no import — override_settings
# não alcança. Patch direto no dict baixa 'login' pra 3/min só neste teste
# (a 4ª tentativa toma 429), com restauração automática.
@mock.patch.dict(
    ScopedRateThrottle.THROTTLE_RATES,
    {"login": "3/min"},
)
class LoginThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()  # contador de throttle vive no cache; não vazar entre casos
        self.url = reverse("accounts:login")
        User.objects.create_user(
            username="joao",
            email="joao@test.com",
            password="SenhaForte123",
            nome="João",
        )

    def test_brute_force_trava_no_limite(self):
        # 3 tentativas com senha ERRADA passam pela validação (400); a 4ª
        # toma 429. O freio roda ANTES da checagem de credencial — é o que
        # trava o brute-force, que é justamente tentativa errada em série.
        payload = {"username": "joao", "password": "errada"}
        for _ in range(3):
            resp = self.client.post(self.url, payload, format="json")
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

        resp = self.client.post(self.url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_login_valido_conta_no_mesmo_balde(self):
        # O freio é por IP, não por sucesso/fracasso: mesmo login correto
        # entra no mesmo contador. 3 logins ok, o 4º toma 429.
        payload = {"username": "joao", "password": "SenhaForte123"}
        for _ in range(3):
            resp = self.client.post(self.url, payload, format="json")
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

        resp = self.client.post(self.url, payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)