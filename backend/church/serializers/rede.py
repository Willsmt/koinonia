import re

from rest_framework import serializers

from ..models import Rede

HEX_COR = re.compile(r"^#[0-9a-fA-F]{6}$")


class RedeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rede
        fields = ["id", "nome", "cor"]

    def validate_cor(self, value):
        if not HEX_COR.match(value):
            raise serializers.ValidationError(
                "Cor deve ser um hex válido, ex: #2563eb."
            )
        return value
