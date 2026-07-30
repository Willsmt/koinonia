from rest_framework import serializers

from ..models import Celula


class CelulaSerializer(serializers.ModelSerializer):
    rede_display = serializers.StringRelatedField(source="rede", read_only=True)

    class Meta:
        model = Celula
        fields = ["id", "nome", "rede", "rede_display"]
