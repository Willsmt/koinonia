from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/church/", include("church.urls")),
    path("api/", include("posts.urls")),
    path("api/", include("posts.urls")),
    path("api/interactions/", include("interactions.urls")),
]
