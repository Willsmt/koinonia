from datetime import timedelta

from django.db.models import Count, F, Q
from django.db.models.deletion import ProtectedError
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Post

from .models import Celula, Membership, Rede
from .permissions import CanManageCelula, CanManageMembership, IsPastor
from .serializers import CelulaSerializer, MembershipSerializer, RedeSerializer


class RedeViewSet(viewsets.ModelViewSet):
    queryset = Rede.objects.all()
    serializer_class = RedeSerializer
    permission_classes = [IsPastor]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Não é possível excluir: ainda existem células "
                        "vinculadas a esta rede."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class CelulaViewSet(viewsets.ModelViewSet):
    queryset = Celula.objects.select_related("rede")
    serializer_class = CelulaSerializer
    permission_classes = [CanManageCelula]

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Não é possível excluir: ainda existem membros "
                        "vinculados a esta célula."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.select_related("user", "celula", "rede")
    serializer_class = MembershipSerializer
    permission_classes = [CanManageMembership]


class DashboardStatsView(APIView):
    """Estatísticas agregadas — só liderança (cell_leader/network_leader/pastor).

    Escopo obedece a mesma hierarquia de sempre: pastor vê a igreja inteira,
    líder de rede só a própria rede, líder de célula só a própria célula.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        m = getattr(request.user, "membership", None)
        role = getattr(m, "role", None)
        if role not in ("cell_leader", "network_leader", "pastor"):
            return Response({"detail": "Sem acesso ao dashboard."}, status=403)

        if role == "pastor":
            celulas_qs = Celula.objects.all()
            membership_qs = Membership.objects.all()
            posts_qs = Post.objects.all()
        elif role == "network_leader":
            celulas_qs = Celula.objects.filter(rede_id=m.rede_id)
            membership_qs = Membership.objects.filter(
                Q(celula__rede_id=m.rede_id) | Q(rede_id=m.rede_id)
            )
            posts_qs = Post.objects.filter(
                Q(escopo="rede", rede_id=m.rede_id)
                | Q(escopo="celula", celula__rede_id=m.rede_id)
            )
        else:  # cell_leader
            celulas_qs = Celula.objects.filter(id=m.celula_id)
            membership_qs = Membership.objects.filter(celula_id=m.celula_id)
            posts_qs = Post.objects.filter(escopo="celula", celula_id=m.celula_id)

        membros_por_celula = list(
            celulas_qs.annotate(total=Count("memberships"))
            .values("nome", "total", rede_nome=F("rede__nome"))
            .order_by("-total")
        )

        posts_por_escopo_qs = posts_qs.values("escopo").annotate(total=Count("id"))
        posts_por_escopo = {"global": 0, "rede": 0, "celula": 0}
        for row in posts_por_escopo_qs:
            posts_por_escopo[row["escopo"]] = row["total"]

        desde = timezone.now() - timedelta(days=14)
        posts_por_dia_qs = (
            posts_qs.filter(created_at__gte=desde)
            .annotate(dia=TruncDate("created_at"))
            .values("dia")
            .annotate(total=Count("id"))
            .order_by("dia")
        )
        posts_por_dia = [
            {"data": p["dia"].isoformat(), "total": p["total"]}
            for p in posts_por_dia_qs
        ]

        celula_mais_ativa = (
            posts_qs.filter(escopo="celula")
            .values("celula__nome")
            .annotate(total=Count("id"))
            .order_by("-total")
            .first()
        )

        return Response(
            {
                "escopo": role,
                "total_membros": membership_qs.count(),
                "membros_por_celula": membros_por_celula,
                "posts_por_escopo": posts_por_escopo,
                "posts_por_dia": posts_por_dia,
                "celula_mais_ativa": (
                    {
                        "nome": celula_mais_ativa["celula__nome"],
                        "total": celula_mais_ativa["total"],
                    }
                    if celula_mais_ativa
                    else None
                ),
            }
        )
