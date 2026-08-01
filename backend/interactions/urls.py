from rest_framework.routers import DefaultRouter

from interactions.views import (
    CommentViewSet,
    FollowViewSet,
    LikeViewSet,
    NotificationViewSet,
)

router = DefaultRouter()
router.register("comments", CommentViewSet, basename="comment")
router.register("likes", LikeViewSet, basename="like")
router.register("follows", FollowViewSet, basename="follow")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = router.urls
