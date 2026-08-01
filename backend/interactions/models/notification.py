from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Tipo(models.TextChoices):
        FOLLOW = "follow", "Novo seguidor"
        LIKE = "like", "Curtida"
        COMMENT = "comment", "Comentário"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications_geradas",
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    lida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "lida", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.actor} → {self.recipient} [{self.tipo}]"
