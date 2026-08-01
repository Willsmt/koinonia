from rest_framework import permissions, viewsets

from reports.models import BugReport
from reports.serializers import BugReportSerializer


class IsPastorOrCreateOnly(permissions.BasePermission):
    """Qualquer autenticado reporta (POST); só pastor lê a lista."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method == "POST":
            return True
        membership = getattr(request.user, "membership", None)
        return getattr(membership, "role", None) == "pastor"


class BugReportViewSet(viewsets.ModelViewSet):
    queryset = BugReport.objects.select_related("reporter").all()
    serializer_class = BugReportSerializer
    permission_classes = [IsPastorOrCreateOnly]
    http_method_names = ["get", "post", "head", "options"]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
