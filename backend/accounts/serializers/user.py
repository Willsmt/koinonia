from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import User
from accounts.validators import (
    normalizar_telefone,
    normalizar_texto,
    validar_telefone_unico,
)


class UserSerializer(serializers.ModelSerializer):
    nome_exibicao = serializers.CharField(read_only=True)
    cor = serializers.CharField(source="cor_escopo", read_only=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "nome",
            "apelido",
            "nome_exibicao",
            "cor",
            "telefone",
            "foto",
            "bio",
            "date_joined",
            "password",
        ]
        read_only_fields = ["id", "username", "date_joined"]
        extra_kwargs = {
            "telefone": {"validators": []},
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
        validar_telefone_unico(telefone, instance=self.instance)
        return telefone

    def validate_foto(self, value):
        limite = 5 * 1024 * 1024  # 5MB
        if value and value.size > limite:
            raise serializers.ValidationError("Imagem maior que 5MB.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        return user
