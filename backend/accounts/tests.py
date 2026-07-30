from django.test import TestCase
from django.urls import reverse


class SmokeTest(TestCase):
    """Prova que a suíte de testes roda e o projeto está sadio."""

    def test_admin_login_page_carrega(self):
        response = self.client.get(reverse('admin:login'))
        self.assertEqual(response.status_code, 200)
