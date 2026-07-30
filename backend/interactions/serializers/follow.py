from rest_framework import serializers

from interactions.models import Follow


class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower", "followed", "created_at"]
        read_only_fields = ["id", "follower", "created_at"]

    def validate_followed(self, followed):
        request = self.context.get("request")
        if request and followed == request.user:
            raise serializers.ValidationError("Não dá pra seguir você mesmo.")
        return followed

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            request
            and Follow.objects.filter(
                follower=request.user, followed=attrs["followed"]
            ).exists()
        ):
            raise serializers.ValidationError("Você já segue esse usuário.")
        return attrs
