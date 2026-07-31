from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from posts.pagination import FeedCursorPagination

from interactions.models import Follow
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
        return Post.objects.readable_by(self.request.user).select_related(
            "author", "posted_as", "celula", "rede"
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    def _feed_paginado(self, qs):
        """Aplica CursorPagination aos feeds.

        Os @action não herdam a paginação default da view (que é page
        number); aqui instanciamos o paginador de cursor direto, mantendo
        o scroll infinito só nos feeds sem afetar os lists normais.
        """
        paginador = FeedCursorPagination()
        page = paginador.paginate_queryset(qs, self.request, view=self)
        serializer = self.get_serializer(page, many=True)
        return paginador.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"])
    def feed_global(self, request):
        # timeline por follow: posts globais de quem você segue (+ os seus)
        seguidos = Follow.objects.filter(follower=request.user).values_list(
            "followed_id", flat=True
        )
        qs = (
            Post.objects.filter(escopo=Post.Escopo.GLOBAL)
            .filter(Q(author_id__in=seguidos) | Q(author=request.user))
            .select_related("author", "posted_as", "celula", "rede")
        )
        return self._feed_paginado(qs)

    @action(detail=False, methods=["get"])
    def feed_celula(self, request):
        # pertencimento: só a célula que você ancora (não a rede toda)
        m = getattr(request.user, "membership", None)
        celula_id = getattr(m, "celula_id", None)
        qs = Post.objects.none()
        if celula_id is not None:
            qs = Post.objects.filter(
                escopo=Post.Escopo.CELULA, celula_id=celula_id
            ).select_related("author", "posted_as", "celula", "rede")
        return self._feed_paginado(qs)

    @action(detail=False, methods=["get"])
    def feed_rede(self, request):
        # pertencimento: a rede que você ancora (via célula, ou direta p/ liderança)
        m = getattr(request.user, "membership", None)
        rede_id = None
        if m is not None:
            rede_id = m.rede_id or (m.celula.rede_id if m.celula_id else None)
        qs = Post.objects.none()
        if rede_id is not None:
            qs = Post.objects.filter(
                escopo=Post.Escopo.REDE, rede_id=rede_id
            ).select_related("author", "posted_as", "celula", "rede")
        return self._feed_paginado(qs)
