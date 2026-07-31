"""Validações de formato compartilhadas entre os serializers de accounts."""

import phonenumbers
from phonenumbers import NumberParseException
from rest_framework import serializers

from accounts.models import User


def normalizar_telefone(valor):
    """Valida um telefone (região BR) e normaliza pro formato E.164.
    Retorna None quando o valor vem vazio (telefone é opcional)."""
    if not valor:
        return None

    try:
        numero = phonenumbers.parse(valor, "BR")
    except NumberParseException as exc:
        raise serializers.ValidationError("Telefone inválido.") from exc

    if not phonenumbers.is_valid_number(numero):
        raise serializers.ValidationError("Telefone inválido.")

    return phonenumbers.format_number(numero, phonenumbers.PhoneNumberFormat.E164)


def validar_telefone_unico(telefone, instance=None):
    """Garante unicidade do telefone já normalizado (ignora a própria instância em updates)."""
    if not telefone:
        return

    qs = User.objects.filter(telefone=telefone)
    if instance is not None:
        qs = qs.exclude(pk=instance.pk)
    if qs.exists():
        raise serializers.ValidationError("Este telefone já está em uso.")


def normalizar_texto(valor):
    """Remove espaços das pontas — usado pra normalizar nome/apelido antes de gravar."""
    return valor.strip() if valor else valor
