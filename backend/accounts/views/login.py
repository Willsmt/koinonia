from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.throttling import ScopedRateThrottle


class LoginView(ObtainAuthToken):
    """Login por token com freio dedicado anti brute-force.

    O obtain_auth_token padrão só herdaria o baseline 'anon'; aqui o
    escopo 'login' (10/min) aperta especificamente a tentativa de
    autenticação por IP.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"