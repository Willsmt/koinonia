from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from posts.models import Post


class PostSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    author_nome = serializers.CharField(source="author.nome_exibicao", read_only=True)
    author_foto = serializers.ImageField(source="author.foto", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "author_nome",
            "author_foto",
            "escopo",
            "celula",
            "rede",
            "posted_as",
            "conteudo",
            "imagem",
            "created_at",
        ]
        read_only_fields = ["id", "author", "created_at"]

    def validate_imagem(self, value):
        limite = 2 * 1024 * 1024  # 2MB
        if value and value.size > limite:
            raise serializers.ValidationError("Imagem maior que 5MB.")
        return value

    def validate(self, attrs):
        self._validar_conteudo_ou_imagem(attrs)
        self._validar_estrutura(attrs)
        self._validar_escrita(attrs)
        return attrs

    def _validar_conteudo_ou_imagem(self, attrs):
        """Espelha o CheckConstraint post_conteudo_ou_imagem. 400."""
        if not attrs.get("conteudo") and not attrs.get("imagem"):
            raise serializers.ValidationError(
                "Post precisa ter texto, imagem, ou os dois — não pode vir vazio."
            )

    def _validar_estrutura(self, attrs):
        """Espelha os CheckConstraint: escopo↔alvo e posted_as só em célula. 400."""
        escopo = attrs.get("escopo")
        celula = attrs.get("celula")
        rede = attrs.get("rede")
        posted_as = attrs.get("posted_as")

        if escopo == Post.Escopo.CELULA:
            if celula is None:
                raise serializers.ValidationError(
                    {"celula": "Obrigatório quando escopo é 'celula'."}
                )
            if rede is not None:
                raise serializers.ValidationError(
                    {"rede": "Deve ficar vazio quando escopo é 'celula'."}
                )
        elif escopo == Post.Escopo.REDE:
            if rede is None:
                raise serializers.ValidationError(
                    {"rede": "Obrigatório quando escopo é 'rede'."}
                )
            if celula is not None:
                raise serializers.ValidationError(
                    {"celula": "Deve ficar vazio quando escopo é 'rede'."}
                )
        elif escopo == Post.Escopo.GLOBAL:
            if celula is not None or rede is not None:
                raise serializers.ValidationError(
                    "Escopo 'global' não aceita célula nem rede."
                )

        if posted_as is not None and escopo != Post.Escopo.CELULA:
            raise serializers.ValidationError(
                {"posted_as": "Só se aplica a posts de escopo 'celula'."}
            )

    def _validar_escrita(self, attrs):
        """Quem pode postar onde. Depende do Membership do request. 403."""
        m = getattr(self.context["request"].user, "membership", None)

        escopo = attrs.get("escopo")
        celula = attrs.get("celula")
        rede = attrs.get("rede")
        posted_as = attrs.get("posted_as")

        if escopo == Post.Escopo.GLOBAL:
            pass  # qualquer autenticado, inclusive user sem célula
        elif escopo == Post.Escopo.CELULA:
            if m is None:
                raise PermissionDenied("Você só pode postar na sua própria célula.")
            if m.role != "pastor" and m.celula_id != celula.id:
                raise PermissionDenied("Você só pode postar na sua própria célula.")
        elif escopo == Post.Escopo.REDE:
            if m is None or m.role not in ("network_leader", "pastor"):
                raise PermissionDenied(
                    "Só líder de rede ou pastor podem postar na rede."
                )
            if m.role == "network_leader" and m.rede_id != rede.id:
                raise PermissionDenied("Você só pode postar na sua própria rede.")

        if posted_as is not None:
            if m is None or m.role != "cell_leader" or m.celula_id != posted_as.id:
                raise PermissionDenied("Só o líder da célula pode postar em nome dela.")
            if posted_as.id != celula.id:
                raise serializers.ValidationError(
                    {"posted_as": "Deve ser a mesma célula do post."}
                )

        return attrs
