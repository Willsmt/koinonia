from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import User
from accounts.validators import (
    normalizar_telefone,
    normalizar_texto,
    validar_telefone_unico,
)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "nome", "apelido", "telefone", "password"]
        extra_kwargs = {
            "apelido": {"required": False},
            "telefone": {"required": False, "validators": []},
        }

    def validate_nome(self, value):
        nome = normalizar_texto(value)
        if not nome:
            raise serializers.ValidationError("Nome não pode ser vazio.")
        return nome

    def validate_apelido(self, value):
        return normalizar_texto(value)

    def validate_telefone(self, value):
        telefone = normalizar_telefone(value)
        validar_telefone_unico(telefone)
        return telefone

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
