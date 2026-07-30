from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following",  # user.following = quem EU sigo
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followers",  # user.followers = quem me segue
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "followed"],
                name="follow_unique_pair",
            ),
            models.CheckConstraint(
                condition=~Q(follower=F("followed")),
                name="follow_no_self",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.follower} → {self.followed}"
