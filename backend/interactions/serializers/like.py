from rest_framework import serializers

from interactions.models import Like
from posts.models import Post


class LikeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.none())

    class Meta:
        model = Like
        fields = ["id", "post", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            self.fields["post"].queryset = Post.objects.readable_by(request.user)

    def validate(self, attrs):
        request = self.context.get("request")
        if (
            request
            and Like.objects.filter(post=attrs["post"], user=request.user).exists()
        ):
            raise serializers.ValidationError("Você já curtiu esse post.")
        return attrs
