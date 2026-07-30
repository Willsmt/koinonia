from rest_framework import serializers

from ..models import Rede


class RedeSerializer(serializers.ModelSerializer):
    cor_display = serializers.CharField(source="get_cor_display", read_only=True)

    class Meta:
        model = Rede
        fields = ["id", "nome", "cor", "cor_display"]