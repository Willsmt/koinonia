from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CelulaViewSet, DashboardStatsView, MembershipViewSet, RedeViewSet

router = DefaultRouter()
router.register("redes", RedeViewSet, basename="rede")
router.register("celulas", CelulaViewSet, basename="celula")
router.register("memberships", MembershipViewSet, basename="membership")

urlpatterns = [
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard-stats"),
] + router.urls
