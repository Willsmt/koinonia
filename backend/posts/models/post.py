from django.conf import settings
from django.db import models
from django.db.models import Q

from posts.models.queryset import PostQuerySet


class Post(models.Model):
    class Escopo(models.TextChoices):
        CELULA = "celula", "Célula"
        REDE = "rede", "Rede"
        GLOBAL = "global", "Global"

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    posted_as = models.ForeignKey(
        "church.Celula",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="posts_como_celula",
    )
    escopo = models.CharField(max_length=10, choices=Escopo.choices)
    celula = models.ForeignKey(
        "church.Celula",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="posts",
    )
    rede = models.ForeignKey(
        "church.Rede",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="posts",
    )
    conteudo = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    objects = PostQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                name="post_escopo_alvo",
                condition=(
                    Q(escopo="celula", celula__isnull=False, rede__isnull=True)
                    | Q(escopo="rede", rede__isnull=False, celula__isnull=True)
                    | Q(escopo="global", celula__isnull=True, rede__isnull=True)
                ),
            ),
            models.CheckConstraint(
                name="post_posted_as_so_celula",
                condition=Q(posted_as__isnull=True) | Q(escopo="celula"),
            ),
        ]
        indexes = [
            models.Index(fields=["escopo", "-created_at"]),
            models.Index(fields=["celula", "-created_at"]),
            models.Index(fields=["rede", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.author} [{self.escopo}] {self.conteudo[:30]}"
