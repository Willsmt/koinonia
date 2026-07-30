from django.db import models


class Rede(models.Model):
    class Cor(models.TextChoices):
        AZUL = "azul", "Azul"
        BRANCA = "branca", "Branca"
        CINZA = "cinza", "Cinza"
        VERMELHA = "vermelha", "Vermelha"

    nome = models.CharField(max_length=80)
    cor = models.CharField(max_length=10, choices=Cor.choices, unique=True)

    class Meta:
        verbose_name = "Rede"
        verbose_name_plural = "Redes"
        ordering = ["cor"]

    def __str__(self):
        return f"Rede {self.get_cor_display()}"