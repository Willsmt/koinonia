from rest_framework.throttling import ScopedRateThrottle


class WriteScopedThrottleMixin:
    """Aplica o escopo de throttle 'interactions_write' apenas na criação.

    Leitura e remoção seguem o throttle global (baseline 'user'); só o
    create — comentar, curtir, seguir — é passível de spam e recebe o
    freio dedicado.
    """

    throttle_scope = "interactions_write"

    def get_throttles(self):
        if self.action == "create":
            return [ScopedRateThrottle()]
        return super().get_throttles()