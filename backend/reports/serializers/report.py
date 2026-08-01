from rest_framework import serializers

from reports.models import BugReport


class BugReportSerializer(serializers.ModelSerializer):
    reporter = serializers.PrimaryKeyRelatedField(read_only=True)
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)

    class Meta:
        model = BugReport
        fields = [
            "id",
            "reporter",
            "reporter_username",
            "descricao",
            "imagem",
            "pagina",
            "resolvido",
            "created_at",
        ]
        read_only_fields = ["id", "reporter", "created_at"]

    def validate_imagem(self, value):
        limite = 2 * 1024 * 1024  # 2MB, mesmo padrão dos posts
        if value and value.size > limite:
            raise serializers.ValidationError("Imagem maior que 2MB.")
        return value
