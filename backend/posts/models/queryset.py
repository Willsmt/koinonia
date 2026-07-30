from django.db import models
from django.db.models import Q


class PostQuerySet(models.QuerySet):
    def readable_by(self, user):
        """Posts que `user` pode LER, derivado do Membership (fonte única).

        global = igreja toda; célula/rede por papel. Mesmo scoping do ciclo 3,
        agora reusável por quem precisa checar leitura (interactions).
        """
        Escopo = self.model.Escopo
        m = getattr(user, "membership", None)
        visivel = Q(escopo=Escopo.GLOBAL)
        if m is not None:
            if m.role in ("pastor", "network_leader"):
                visivel |= Q(escopo__in=[Escopo.CELULA, Escopo.REDE])
            elif m.role == "cell_leader":
                rede_id = m.celula.rede_id
                visivel |= Q(escopo=Escopo.CELULA, celula__rede_id=rede_id)
                visivel |= Q(escopo=Escopo.REDE, rede_id=rede_id)
            elif m.role == "member":
                visivel |= Q(escopo=Escopo.CELULA, celula_id=m.celula_id)
                visivel |= Q(escopo=Escopo.REDE, rede_id=m.celula.rede_id)
        return self.filter(visivel)
