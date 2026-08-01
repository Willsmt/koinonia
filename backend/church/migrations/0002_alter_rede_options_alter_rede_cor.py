import django.core.validators
from django.db import migrations, models

COR_ANTIGA_PARA_HEX = {
    "azul": "#2563eb",
    "branca": "#94a3b8",
    "cinza": "#475569",
    "vermelha": "#dc2626",
}


def converter_cores_para_hex(apps, schema_editor):
    Rede = apps.get_model("church", "Rede")
    for rede in Rede.objects.all():
        hex_novo = COR_ANTIGA_PARA_HEX.get(rede.cor)
        if hex_novo:
            rede.cor = hex_novo
            rede.save(update_fields=["cor"])


def reverter_cores_para_nome(apps, schema_editor):
    Rede = apps.get_model("church", "Rede")
    hex_para_nome = {v: k for k, v in COR_ANTIGA_PARA_HEX.items()}
    for rede in Rede.objects.all():
        nome_antigo = hex_para_nome.get(rede.cor)
        if nome_antigo:
            rede.cor = nome_antigo
            rede.save(update_fields=["cor"])


class Migration(migrations.Migration):

    dependencies = [
        ('church', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='rede',
            options={'ordering': ['nome'], 'verbose_name': 'Rede', 'verbose_name_plural': 'Redes'},
        ),
        migrations.RunPython(converter_cores_para_hex, reverter_cores_para_nome),
        migrations.AlterField(
            model_name='rede',
            name='cor',
            field=models.CharField(max_length=7, validators=[django.core.validators.RegexValidator('^#[0-9a-fA-F]{6}$', 'Cor deve ser um hex válido, ex: #2563eb.')]),
        ),
    ]
