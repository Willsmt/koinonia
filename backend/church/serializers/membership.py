from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

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

    @extend_schema_field(OpenApiTypes.INT)
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

        self._validar_autorizacao(role, celula)
        return attrs

    def _validar_autorizacao(self, role_alvo, celula_alvo):
        """Quem pode atribuir qual role — escalonamento de privilégio. 403.

        pastor: gerencia tudo.
        network_leader: só atribui member/cell_leader, dentro da própria rede.
        cell_leader: só atribui member, dentro da própria célula.
        """
        request = self.context.get("request")
        if request is None:
            return
        ator = getattr(request.user, "membership", None)

        if ator is not None and ator.role == Membership.Role.PASTOR:
            return

        if ator is not None and ator.role == Membership.Role.NETWORK_LEADER:
            if role_alvo not in {Membership.Role.MEMBER, Membership.Role.CELL_LEADER}:
                raise PermissionDenied("Líder de rede só atribui member ou cell_leader.")
            if celula_alvo is None or celula_alvo.rede_id != ator.rede_id:
                raise PermissionDenied("Você só gerencia membros da sua própria rede.")
            return

        if ator is not None and ator.role == Membership.Role.CELL_LEADER:
            if role_alvo != Membership.Role.MEMBER:
                raise PermissionDenied("Líder de célula só atribui member.")
            if celula_alvo is None or celula_alvo.id != ator.celula_id:
                raise PermissionDenied("Você só gerencia membros da sua própria célula.")
            return

        raise PermissionDenied("Seu papel não gerencia memberships.")
