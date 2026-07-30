from rest_framework import viewsets

from .models import Celula, Membership, Rede
from .permissions import CanManageCelula, CanManageMembership, IsPastor
from .serializers import CelulaSerializer, MembershipSerializer, RedeSerializer


class RedeViewSet(viewsets.ModelViewSet):
    queryset = Rede.objects.all()
    serializer_class = RedeSerializer
    permission_classes = [IsPastor]


class CelulaViewSet(viewsets.ModelViewSet):
    queryset = Celula.objects.select_related("rede")
    serializer_class = CelulaSerializer
    permission_classes = [CanManageCelula]


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.select_related("user", "celula", "rede")
    serializer_class = MembershipSerializer
    permission_classes = [CanManageMembership]