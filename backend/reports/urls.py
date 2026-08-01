from rest_framework.routers import DefaultRouter

from reports.views import BugReportViewSet

router = DefaultRouter()
router.register(r"bug-reports", BugReportViewSet, basename="bugreport")

urlpatterns = router.urls
