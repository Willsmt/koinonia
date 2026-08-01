from rest_framework import permissions

from .models import Membership


def _role(user):
    """Role do membership do user, ou None se não tiver."""
    if not user or not user.is_authenticated:
        return None
    membership = getattr(user, "membership", None)
    return membership.role if membership else None


class IsPastor(permissions.BasePermission):
    """Só pastor escreve; leitura liberada para autenticado."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return _role(request.user) == Membership.Role.PASTOR


class CanManageCelula(permissions.BasePermission):
    """Pastor e líder de rede escrevem; leitura para autenticado."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return _role(request.user) in {
            Membership.Role.PASTOR,
            Membership.Role.NETWORK_LEADER,
        }

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = _role(request.user)
        if role == Membership.Role.PASTOR:
            return True
        if role == Membership.Role.NETWORK_LEADER:
            return obj.rede_id == request.user.membership.rede_id
        return False


class CanManageMembership(permissions.BasePermission):
    """Líder de célula, líder de rede e pastor escrevem; leitura para autenticado.

    has_permission cobre create (sem instância ainda — o resto da checagem de
    role/escopo do alvo fica no serializer). has_object_permission cobre
    update/delete: sem isso, qualquer líder conseguia mexer em Membership de
    fora do próprio escopo (ex.: cell_leader deletando membership de outra
    célula, ou do próprio pastor).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return _role(request.user) in {
            Membership.Role.PASTOR,
            Membership.Role.NETWORK_LEADER,
            Membership.Role.CELL_LEADER,
        }

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        role = _role(request.user)
        if role == Membership.Role.PASTOR:
            return True
        if role == Membership.Role.NETWORK_LEADER:
            rede_do_alvo = obj.rede_efetiva
            return (
                rede_do_alvo is not None
                and rede_do_alvo.id == request.user.membership.rede_id
            )
        if role == Membership.Role.CELL_LEADER:
            return (
                obj.celula_id == request.user.membership.celula_id
                and obj.role == Membership.Role.MEMBER
            )
        return False
