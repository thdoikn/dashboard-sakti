from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("anggaran", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="anggaran",
            name="kode_program",
            field=models.CharField(max_length=20, verbose_name="Kode Program"),
        ),
        migrations.AlterField(
            model_name="anggaran",
            name="kode_kegiatan",
            field=models.CharField(max_length=20, verbose_name="Kode Kegiatan"),
        ),
        migrations.AlterField(
            model_name="anggaran",
            name="kode_output",
            field=models.CharField(max_length=20, verbose_name="Kode Output"),
        ),
        migrations.AlterField(
            model_name="anggaran",
            name="kode_suboutput",
            field=models.CharField(
                blank=True, default="", max_length=20, verbose_name="Kode Sub-Output"
            ),
        ),
        migrations.AlterField(
            model_name="anggaran",
            name="kode_komponen",
            field=models.CharField(max_length=20, verbose_name="Kode Komponen"),
        ),
        migrations.AlterField(
            model_name="anggaran",
            name="kode_akun",
            field=models.CharField(max_length=20, verbose_name="Kode Akun"),
        ),
    ]
