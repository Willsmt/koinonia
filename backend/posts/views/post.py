from django.db.models import Q
from rest_framework import permissions, viewsets

from posts.models import Post
from posts.serializers import PostSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Leitura pra qualquer um no escopo; escrita/remoção só do autor do post."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author_id == request.user.id


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        m = getattr(user, "membership", None)

        # global é legível pra igreja toda; o follow filtra só o feed global
        visivel = Q(escopo=Post.Escopo.GLOBAL)

        if m is not None:
            if m.role in ("pastor", "network_leader"):
                visivel |= Q(escopo__in=[Post.Escopo.CELULA, Post.Escopo.REDE])
            elif m.role == "cell_leader":
                rede_id = (
                    m.celula.rede_id
                )  # rede_efetiva; celula é NOT NULL p/ esse papel
                visivel |= Q(escopo=Post.Escopo.CELULA, celula__rede_id=rede_id)
                visivel |= Q(escopo=Post.Escopo.REDE, rede_id=rede_id)
            elif m.role == "member":
                visivel |= Q(escopo=Post.Escopo.CELULA, celula_id=m.celula_id)
                visivel |= Q(escopo=Post.Escopo.REDE, rede_id=m.celula.rede_id)

        return Post.objects.filter(visivel).select_related(
            "author", "posted_as", "celula", "rede"
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
