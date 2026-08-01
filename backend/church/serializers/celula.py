from rest_framework import serializers

from ..models import Celula, Membership


class CelulaSerializer(serializers.ModelSerializer):
    rede_display = serializers.StringRelatedField(source="rede", read_only=True)

    class Meta:
        model = Celula
        fields = ["id", "nome", "rede", "rede_display"]

    def validate(self, attrs):
        request = self.context.get("request")
        m = getattr(request.user, "membership", None) if request else None
        if m and m.role == Membership.Role.NETWORK_LEADER:
            rede = attrs.get("rede", getattr(self.instance, "rede", None))
            if rede is not None and rede.id != m.rede_id:
                raise serializers.ValidationError(
                    {"rede": "Você só pode gerenciar células da sua própria rede."}
                )
        return attrs
