import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()

USERNAMES = ["deus", "jesus", "espirito_santo"]


class Command(BaseCommand):
    help = "Define uma senha (compartilhada) pras 3 contas divinas do seed_demo."

    def handle(self, *args, **options):
        password = getpass.getpass("Nova senha pra deus/jesus/espirito_santo: ")
        confirm = getpass.getpass("Confirma a senha: ")

        if password != confirm:
            raise CommandError("Senhas não batem, nada foi alterado.")

        for username in USERNAMES:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"{username} não existe, pulando.")
                )
                continue
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Senha atualizada: {username}"))
