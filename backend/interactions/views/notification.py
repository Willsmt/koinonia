from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from interactions.models import Notification
from interactions.serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user).select_related("actor", "post")
        lida = self.request.query_params.get("lida")
        if lida is not None:
            qs = qs.filter(lida=lida.lower() == "true")
        return qs

    @action(detail=False, methods=["patch"])
    def marcar_tudo_lido(self, request):
        self.get_queryset().filter(lida=False).update(lida=True)
        return Response({"status": "ok"})
