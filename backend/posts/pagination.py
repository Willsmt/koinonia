from rest_framework.pagination import CursorPagination


class FeedCursorPagination(CursorPagination):
    """Paginação por cursor para os feeds — scroll infinito estável.

    Ordena por -created_at (mais recente primeiro); o cursor ancora na
    posição real, sem drift de offset quando entra post novo no topo.
    """

    page_size = 20
    ordering = "-created_at"
