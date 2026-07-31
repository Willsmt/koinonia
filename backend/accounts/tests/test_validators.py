from django.test import TestCase
from rest_framework import serializers

from accounts.models import User
from accounts.validators import (
    normalizar_telefone,
    normalizar_texto,
    validar_telefone_unico,
)


class NormalizarTelefoneTests(TestCase):
    def test_vazio_retorna_none(self):
        self.assertIsNone(normalizar_telefone(""))
        self.assertIsNone(normalizar_telefone(None))

    def test_formatos_diferentes_normalizam_pro_mesmo_e164(self):
        variantes = [
            "11987654321",
            "(11) 98765-4321",
            "+55 11 98765-4321",
        ]
        normalizados = {normalizar_telefone(v) for v in variantes}
        self.assertEqual(normalizados, {"+5511987654321"})

    def test_numero_invalido_levanta_validation_error(self):
        with self.assertRaises(serializers.ValidationError):
            normalizar_telefone("123")

    def test_numero_nao_parseavel_levanta_validation_error(self):
        with self.assertRaises(serializers.ValidationError):
            normalizar_telefone("abc")


class ValidarTelefoneUnicoTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="joao",
            email="joao@example.com",
            password="SenhaForte123!",
            nome="João",
            telefone="+5511987654321",
        )

    def test_telefone_ja_em_uso_levanta_validation_error(self):
        with self.assertRaises(serializers.ValidationError):
            validar_telefone_unico("+5511987654321")

    def test_telefone_ja_em_uso_mas_excluindo_a_propria_instancia_ok(self):
        # não deve levantar — é o próprio usuário se atualizando
        validar_telefone_unico("+5511987654321", instance=self.user)

    def test_telefone_vazio_nao_levanta(self):
        validar_telefone_unico(None)
        validar_telefone_unico("")

    def test_telefone_novo_nao_levanta(self):
        validar_telefone_unico("+5511999998888")


class NormalizarTextoTests(TestCase):
    def test_remove_espacos_das_pontas(self):
        self.assertEqual(normalizar_texto("  João  "), "João")

    def test_so_espaco_vira_vazio(self):
        self.assertEqual(normalizar_texto("   "), "")

    def test_vazio_permanece_vazio(self):
        self.assertEqual(normalizar_texto(""), "")

    def test_none_permanece_none(self):
        self.assertIsNone(normalizar_texto(None))
