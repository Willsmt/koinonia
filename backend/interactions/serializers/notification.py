from rest_framework import serializers

from interactions.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_nome = serializers.CharField(source="actor.nome_exibicao", read_only=True)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "actor", "actor_nome", "tipo", "tipo_display", "post", "lida", "created_at"]
        read_only_fields = ["id", "actor", "tipo", "post", "created_at"]
