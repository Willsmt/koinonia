from django.contrib import admin

from .models import Celula, Membership, Rede


@admin.register(Rede)
class RedeAdmin(admin.ModelAdmin):
    list_display = ("nome", "cor")
    search_fields = ("nome",)


@admin.register(Celula)
class CelulaAdmin(admin.ModelAdmin):
    list_display = ("nome", "rede")
    list_filter = ("rede",)
    search_fields = ("nome",)
    autocomplete_fields = ("rede",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "celula", "rede")
    list_filter = ("role", "rede")
    search_fields = ("user__username", "user__email")
    autocomplete_fields = ("user", "celula", "rede")
