from rest_framework import permissions, viewsets

from interactions.models import Like
from interactions.serializers import LikeSerializer
from interactions.throttling import WriteScopedThrottleMixin
from posts.models import Post


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id


class LikeViewSet(WriteScopedThrottleMixin, viewsets.ModelViewSet):
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        posts_visiveis = Post.objects.readable_by(self.request.user)
        qs = Like.objects.filter(post__in=posts_visiveis).select_related("user", "post")
        post_id = self.request.query_params.get("post")
        if post_id is not None:
            qs = qs.filter(post_id=post_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
