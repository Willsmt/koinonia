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


class CanManageMembership(permissions.BasePermission):
    """Líder de célula, líder de rede e pastor escrevem."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return _role(request.user) in {
            Membership.Role.PASTOR,
            Membership.Role.NETWORK_LEADER,
            Membership.Role.CELL_LEADER,
        }
