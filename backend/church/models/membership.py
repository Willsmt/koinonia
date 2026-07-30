from django.conf import settings
from django.db import models
from django.db.models import Q


class Membership(models.Model):
    class Role(models.TextChoices):
        MEMBER = "member", "Membro"
        CELL_LEADER = "cell_leader", "Líder de célula"
        NETWORK_LEADER = "network_leader", "Líder de rede"
        PASTOR = "pastor", "Pastor"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="membership",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    celula = models.ForeignKey(
        "church.Celula",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="memberships",
    )
    rede = models.ForeignKey(
        "church.Rede",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="memberships",
    )

    class Meta:
        verbose_name = "Membership"
        verbose_name_plural = "Memberships"
        constraints = [
            models.CheckConstraint(
                name="membership_role_scope",
                condition=(
                    (Q(role__in=["member", "cell_leader"]) & Q(celula__isnull=False) & Q(rede__isnull=True))
                    | (Q(role="network_leader") & Q(celula__isnull=True) & Q(rede__isnull=False))
                    | (Q(role="pastor") & Q(celula__isnull=True) & Q(rede__isnull=True))
                ),
            ),
        ]

    @property
    def rede_efetiva(self):
        """Rede à qual o membership pertence, derivada da âncora."""
        if self.rede_id:
            return self.rede
        if self.celula_id:
            return self.celula.rede
        return None

    def __str__(self):
        return f"{self.user} — {self.get_role_display()}"