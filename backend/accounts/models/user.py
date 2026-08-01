from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField("e-mail", unique=True)
    nome = models.CharField("nome", max_length=150)
    apelido = models.CharField("apelido (nome de exibição)", max_length=50, blank=True)
    telefone = models.CharField(
        "telefone",
        max_length=20,
        null=True,  # permite vários sem telefone sob o unique
        blank=True,
        unique=True,
    )
    foto = models.ImageField("foto", upload_to="perfis/", null=True, blank=True)
    bio = models.TextField("bio", max_length=280, blank=True)

    @property
    def nome_exibicao(self):
        return self.apelido or self.nome

    @property
    def cor_escopo(self):
        """Cor derivada do Membership: cor da rede efetiva, 'pastor' pra pastor, None se solto."""
        membership = getattr(self, "membership", None)
        if membership is None:
            return None
        if membership.role == "pastor":
            return "pastor"
        return membership.rede_efetiva.cor

    def __str__(self):
        return f"@{self.username} ({self.nome_exibicao})"
