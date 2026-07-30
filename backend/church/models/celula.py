from django.db import models


class Celula(models.Model):
    nome = models.CharField(max_length=120)
    rede = models.ForeignKey(
        "church.Rede",
        on_delete=models.PROTECT,
        related_name="celulas",
    )

    class Meta:
        verbose_name = "Célula"
        verbose_name_plural = "Células"
        ordering = ["nome"]

    def __str__(self):
        return self.nome
