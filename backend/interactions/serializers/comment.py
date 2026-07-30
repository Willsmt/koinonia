from rest_framework import serializers

from interactions.models import Comment
from posts.models import Post


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.PrimaryKeyRelatedField(read_only=True)
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.none())

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "conteudo", "created_at"]
        read_only_fields = ["id", "author", "created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            self.fields["post"].queryset = Post.objects.readable_by(request.user)
