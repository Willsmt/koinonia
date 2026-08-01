from rest_framework import permissions, viewsets

from interactions.models import Follow, Notification
from interactions.serializers import FollowSerializer
from interactions.throttling import WriteScopedThrottleMixin


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.follower_id == request.user.id


class FollowViewSet(WriteScopedThrottleMixin, viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    queryset = Follow.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Follow.objects.select_related("follower", "followed")
        rel = self.request.query_params.get("rel")
        if rel == "followers":
            return qs.filter(followed=user)  # quem me segue
        return qs.filter(follower=user)  # default: quem eu sigo (seguidos)

    def perform_create(self, serializer):
        follow = serializer.save(follower=self.request.user)
        Notification.objects.create(
            recipient=follow.followed,
            actor=self.request.user,
            tipo=Notification.Tipo.FOLLOW,
        )
