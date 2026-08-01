from rest_framework import serializers

from accounts.models import User


class PublicUserSerializer(serializers.ModelSerializer):
    nome_exibicao = serializers.CharField(read_only=True)
    cor = serializers.CharField(source="cor_escopo", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "nome_exibicao",
            "cor",
            "foto",
            "bio",
            "date_joined",
        ]
        read_only_fields = fields
