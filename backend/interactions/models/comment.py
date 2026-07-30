from django.conf import settings
from django.db import models


class Comment(models.Model):
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    conteudo = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]  # thread cronológica: mais antigo primeiro

    def __str__(self):
        return f"Comment de {self.author} em post {self.post_id}"
