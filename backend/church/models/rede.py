from django.core.validators import RegexValidator
from django.db import models


class Rede(models.Model):
    nome = models.CharField(max_length=80)
    cor = models.CharField(
        max_length=7,
        validators=[
            RegexValidator(
                r"^#[0-9a-fA-F]{6}$", "Cor deve ser um hex válido, ex: #2563eb."
            )
        ],
    )

    class Meta:
        verbose_name = "Rede"
        verbose_name_plural = "Redes"
        ordering = ["nome"]

    def __str__(self):
        return f"Rede {self.nome}"
