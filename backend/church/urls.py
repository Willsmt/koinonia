from rest_framework.routers import DefaultRouter

from .views import CelulaViewSet, MembershipViewSet, RedeViewSet

router = DefaultRouter()
router.register("redes", RedeViewSet, basename="rede")
router.register("celulas", CelulaViewSet, basename="celula")
router.register("memberships", MembershipViewSet, basename="membership")

urlpatterns = router.urls
