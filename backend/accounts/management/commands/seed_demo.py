import secrets
import getpass

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from church.models import Rede, Membership
from posts.models import Post

User = get_user_model()

DIVINE = [
    {
        "username": "deus",
        "nome": "Deus",
        "email": "deus@koinonia.app",
        "post": (
            "Dica pra sua célula esta semana: cultivem a unidade acima de "
            "tudo. Em Salmos 133:1 fica claro o quanto é bom e agradável "
            "quando um povo vive junto em harmonia — uma célula unida "
            "floresce em bênçãos que uma célula dividida nunca alcança. ✨"
        ),
    },
    {
        "username": "jesus",
        "nome": "Jesus",
        "email": "jesus@koinonia.app",
        "post": (
            "Uma dica de coração pra célula de vocês: recebam bem quem "
            "chega, mesmo sendo poucos. Eu mesmo disse, em Mateus 18:20, "
            "que onde dois ou três se reúnem em Meu nome, Eu estou presente "
            "no meio deles — toda célula é sagrada, grande ou pequena. 🕊️"
        ),
    },
    {
        "username": "espirito_santo",
        "nome": "Espírito Santo",
        "email": "espiritosanto@koinonia.app",
        "post": (
            "Ensinamento pras células: sigam o modelo da igreja primitiva. "
            "Atos 2:42 registra que os primeiros cristãos se dedicavam à "
            "doutrina dos apóstolos, à comunhão, à oração e a repartir o "
            "pão — comunhão de verdade transforma qualquer roda de "
            "conversa em um altar. 🔥"
        ),
    },
]


class Command(BaseCommand):
    help = "Seed inicial de demonstração: usuários especiais + bootstrap de Rede."

    @transaction.atomic
    def handle(self, *args, **options):
        rede, created = Rede.objects.get_or_create(
            cor="azul", defaults={"nome": "Rede Principal"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Rede criada: {rede.nome}"))

        for pessoa in DIVINE:
            user, created = User.objects.get_or_create(
                username=pessoa["username"],
                defaults={"nome": pessoa["nome"], "email": pessoa["email"]},
            )
            if created:
                user.set_password(secrets.token_urlsafe(32))
                user.save()
                Membership.objects.create(user=user, role="pastor")
                Post.objects.create(
                    author=user, escopo="global", conteudo=pessoa["post"]
                )
                self.stdout.write(self.style.SUCCESS(f"Criado: {pessoa['nome']}"))
            else:
                self.stdout.write(f"Já existia: {pessoa['nome']}")

        self.stdout.write(self.style.WARNING("\n— Agora a sua conta —"))
        username = input("Seu username: ").strip()
        nome = input("Seu nome: ").strip()
        email = input("Seu e-mail: ").strip()
        password = getpass.getpass("Sua senha: ")

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR("Username já existe, abortando."))
            return

        me = User.objects.create_user(
            username=username, email=email, nome=nome, password=password
        )
        Membership.objects.create(user=me, role="pastor")
        Post.objects.create(
            author=me,
            escopo="global",
            conteudo=(
                "Boas-vindas ao koinonia! 🙏 Esse projeto nasceu como TCC do meu "
                "curso de Full Stack Python (EBAC), unindo tecnologia e fé: uma "
                "rede social pensada pra comunidades de igreja organizadas em "
                "células, redes e liderança. Todo o código é aberto, com "
                "segurança, testes automatizados e deploy em produção real. "
                "Espero que gostem! — Willians"
            ),
        )
        self.stdout.write(self.style.SUCCESS(f"Conta criada: {me.username}"))
