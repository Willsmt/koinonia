from rest_framework import filters, generics, permissions

from accounts.models import User
from accounts.serializers import PublicUserSerializer


class UserListView(generics.ListAPIView):
    """Lista/busca pública de usuários — qualquer autenticado, qualquer usuário.

    ?search=<termo> filtra por username/nome/apelido.
    """

    queryset = User.objects.all().order_by("username")
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "nome", "apelido"]


class UserDetailView(generics.RetrieveAPIView):
    """Perfil público de um usuário específico — qualquer autenticado."""

    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
