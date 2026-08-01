from django.conf import settings
from django.db import models


class BugReport(models.Model):
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bug_reports",
    )
    descricao = models.TextField(max_length=2000)
    imagem = models.ImageField(upload_to="bug_reports/", blank=True)
    pagina = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reporter} — {self.descricao[:40]}"
