from rest_framework import permissions, viewsets

from interactions.models import Comment
from interactions.serializers import CommentSerializer
from posts.models import Post


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author_id == request.user.id


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        # só comentários de posts que o user pode ler; opcional ?post=<id>
        posts_visiveis = Post.objects.readable_by(self.request.user)
        qs = Comment.objects.filter(post__in=posts_visiveis).select_related(
            "author", "post"
        )
        post_id = self.request.query_params.get("post")
        if post_id is not None:
            qs = qs.filter(post_id=post_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
