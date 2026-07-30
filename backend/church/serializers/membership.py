from rest_framework import serializers

from ..models import Membership


class MembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    rede_efetiva = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = [
            "id",
            "user",
            "username",
            "role",
            "role_display",
            "celula",
            "rede",
            "rede_efetiva",
        ]

    def get_rede_efetiva(self, obj):
        rede = obj.rede_efetiva
        return rede.id if rede else None

    def validate(self, attrs):
        role = attrs.get("role", getattr(self.instance, "role", None))
        celula = attrs.get("celula", getattr(self.instance, "celula", None))
        rede = attrs.get("rede", getattr(self.instance, "rede", None))

        roles_de_celula = {Membership.Role.MEMBER, Membership.Role.CELL_LEADER}

        if role in roles_de_celula:
            if celula is None:
                raise serializers.ValidationError(
                    {"celula": "Obrigatória para membro e líder de célula."}
                )
            if rede is not None:
                raise serializers.ValidationError(
                    {"rede": "Não preencha rede aqui — ela é derivada da célula."}
                )
        elif role == Membership.Role.NETWORK_LEADER:
            if rede is None:
                raise serializers.ValidationError(
                    {"rede": "Obrigatória para líder de rede."}
                )
            if celula is not None:
                raise serializers.ValidationError(
                    {"celula": "Líder de rede não é ancorado em célula."}
                )
        elif role == Membership.Role.PASTOR:
            if celula is not None or rede is not None:
                raise serializers.ValidationError(
                    "Pastor tem escopo igreja inteira — deixe célula e rede vazias."
                )

        return attrs