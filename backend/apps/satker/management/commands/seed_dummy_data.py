"""
Management command: seed_dummy_data

Populates the database with realistic dummy data for OIKN's 6 satker.
Idempotent — uses update_or_create throughout, safe to re-run.

Usage:
    python manage.py seed_dummy_data
    python manage.py seed_dummy_data --clear  # clears Anggaran/Realisasi/CapaianRO first

Data characteristics:
- 6 OIKN satker with codes 999001–999006
- Jan–Jun 2026 data (tahun_anggaran=2026)
- Budget (anggaran) in the 200–500 billion IDR range per satker
- Disbursement (realisasi) increasing month over month:
  ~5-10% of budget in Jan, reaching ~35-45% by Jun
- CapaianRO progress matching the disbursement curve
"""

import logging
import random
from datetime import date, datetime, timezone
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone as django_timezone

from apps.anggaran.models import Anggaran, Referensi
from apps.capaian.models import CapaianRO
from apps.realisasi.models import Realisasi
from apps.satker.models import Satker

logger = logging.getLogger(__name__)

# ── Satker master data ────────────────────────────────────────────────────────

SATKER_DATA = [
    {
        "kode_satker": "999001",
        "nama_satker": "Satker Sekretariat OIKN",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
    {
        "kode_satker": "999002",
        "nama_satker": "Satker Bidang Infrastruktur dan Kewilayahan",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
    {
        "kode_satker": "999003",
        "nama_satker": "Satker Bidang Teknologi Digital dan Inovasi",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
    {
        "kode_satker": "999004",
        "nama_satker": "Satker Bidang Hukum dan Kepatuhan",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
    {
        "kode_satker": "999005",
        "nama_satker": "Satker Bidang Sumber Daya Manusia",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
    {
        "kode_satker": "999006",
        "nama_satker": "Satker Bidang Keuangan dan Kekayaan",
        "kode_kementerian": "999",
        "kode_kppn": "019",
    },
]

# ── Program / kegiatan reference data ─────────────────────────────────────────

REFERENSI_DATA = [
    # Programs
    {"jenis": "program", "kode": "001", "uraian": "Dukungan Manajemen"},
    {"jenis": "program", "kode": "002", "uraian": "Pembangunan Infrastruktur IKN"},
    {"jenis": "program", "kode": "003", "uraian": "Pengelolaan Kawasan Khusus IKN"},
    # Kegiatan
    {"jenis": "kegiatan", "kode": "001.001", "uraian": "Pengelolaan Kepegawaian dan Umum"},
    {"jenis": "kegiatan", "kode": "001.002", "uraian": "Pengelolaan Keuangan dan BMN"},
    {"jenis": "kegiatan", "kode": "002.001", "uraian": "Pembangunan Infrastruktur Dasar"},
    {"jenis": "kegiatan", "kode": "002.002", "uraian": "Pembangunan Infrastruktur Digital"},
    {"jenis": "kegiatan", "kode": "003.001", "uraian": "Perencanaan dan Evaluasi Kawasan"},
    # Output
    {"jenis": "output", "kode": "001.001.001", "uraian": "Layanan Perkantoran"},
    {"jenis": "output", "kode": "001.002.001", "uraian": "Layanan Dukungan Manajemen Satker"},
    {"jenis": "output", "kode": "002.001.001", "uraian": "Infrastruktur Jalan Kawasan IKN"},
    {"jenis": "output", "kode": "002.002.001", "uraian": "Infrastruktur Jaringan Digital IKN"},
    {"jenis": "output", "kode": "003.001.001", "uraian": "Dokumen Rencana Kawasan IKN"},
    # Komponen
    {"jenis": "komponen", "kode": "001", "uraian": "Gaji dan Tunjangan"},
    {"jenis": "komponen", "kode": "002", "uraian": "Operasional Perkantoran"},
    {"jenis": "komponen", "kode": "003", "uraian": "Belanja Modal"},
    {"jenis": "komponen", "kode": "004", "uraian": "Belanja Jasa"},
    # Akun
    {"jenis": "akun", "kode": "511111", "uraian": "Belanja Gaji Pokok PNS"},
    {"jenis": "akun", "kode": "521111", "uraian": "Belanja Keperluan Perkantoran"},
    {"jenis": "akun", "kode": "522111", "uraian": "Belanja Langganan Daya dan Jasa"},
    {"jenis": "akun", "kode": "532111", "uraian": "Belanja Modal Peralatan dan Mesin"},
    {"jenis": "akun", "kode": "533111", "uraian": "Belanja Modal Gedung dan Bangunan"},
]

# ── Budget template per satker ────────────────────────────────────────────────
# Each entry: (kode_program, kode_kegiatan, kode_output, kode_suboutput,
#              kode_komponen, kode_akun, uraian_item, base_total_billions)
ANGGARAN_TEMPLATE = [
    ("001", "001.001", "001.001.001", "001", "001", "511111",
     "Belanja Gaji dan Tunjangan Pegawai", Decimal("15")),
    ("001", "001.001", "001.001.001", "001", "002", "521111",
     "Belanja Operasional Perkantoran", Decimal("8")),
    ("001", "001.002", "001.002.001", "001", "002", "522111",
     "Belanja Langganan Listrik dan Air", Decimal("3")),
    ("002", "002.001", "002.001.001", "001", "003", "533111",
     "Belanja Modal Pembangunan Gedung", Decimal("120")),
    ("002", "002.002", "002.002.001", "001", "003", "532111",
     "Belanja Modal Infrastruktur Digital", Decimal("80")),
    ("003", "003.001", "003.001.001", "001", "004", "521111",
     "Belanja Jasa Konsultan Perencanaan", Decimal("25")),
]

# Monthly disbursement rate ramp-up (Jan=0.06 → Jun=0.40 of annual budget)
MONTHLY_ABSORPTION_RATES = [0.06, 0.11, 0.18, 0.25, 0.33, 0.40]

TAHUN_ANGGARAN = 2026
MONTHS = [1, 2, 3, 4, 5, 6]  # Jan - Jun 2026


class Command(BaseCommand):
    help = (
        "Seed the database with realistic dummy data for OIKN's 6 satker. "
        "Idempotent — safe to re-run (uses update_or_create). "
        "Use --clear to wipe Anggaran/Realisasi/CapaianRO before seeding."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing Anggaran, Realisasi, and CapaianRO records before seeding",
        )

    def handle(self, *args, **options) -> None:
        random.seed(42)  # Deterministic random for reproducible data

        if options["clear"]:
            self.stdout.write("Clearing existing Anggaran, Realisasi, CapaianRO data...")
            Anggaran.objects.all().delete()
            Realisasi.objects.all().delete()
            CapaianRO.objects.all().delete()
            self.stdout.write(self.style.WARNING("Data cleared."))

        self._seed_referensi()
        satker_list = self._seed_satker()
        self._seed_anggaran(satker_list)
        self._seed_realisasi(satker_list)
        self._seed_capaian(satker_list)

        self.stdout.write(self.style.SUCCESS("Seed data berhasil dibuat!"))

    # ── Referensi ─────────────────────────────────────────────────────────────

    def _seed_referensi(self) -> None:
        self.stdout.write("Seeding Referensi...")
        created_count = 0
        for ref in REFERENSI_DATA:
            _, created = Referensi.objects.update_or_create(
                jenis=ref["jenis"],
                kode=ref["kode"],
                defaults={"uraian": ref["uraian"]},
            )
            if created:
                created_count += 1
        self.stdout.write(f"  Referensi: {created_count} baru, {len(REFERENSI_DATA) - created_count} diperbarui")

    # ── Satker ────────────────────────────────────────────────────────────────

    def _seed_satker(self) -> list[Satker]:
        self.stdout.write("Seeding Satker...")
        satker_list = []
        for data in SATKER_DATA:
            satker, created = Satker.objects.update_or_create(
                kode_satker=data["kode_satker"],
                defaults={
                    "nama_satker": data["nama_satker"],
                    "kode_kementerian": data["kode_kementerian"],
                    "kode_kppn": data["kode_kppn"],
                    "aktif": True,
                },
            )
            satker_list.append(satker)
            action = "dibuat" if created else "diperbarui"
            self.stdout.write(f"  {satker.kode_satker} — {satker.nama_satker} [{action}]")
        return satker_list

    # ── Anggaran ──────────────────────────────────────────────────────────────

    def _seed_anggaran(self, satker_list: list[Satker]) -> None:
        self.stdout.write("Seeding Anggaran...")
        synced_at = django_timezone.now()
        total_created = 0
        total_updated = 0

        for satker in satker_list:
            # Each satker gets a slightly different budget multiplier (0.8 - 1.5x)
            multiplier = Decimal(str(round(random.uniform(0.8, 1.5), 2)))
            kode_sts_history = f"STS{TAHUN_ANGGARAN}001"

            for idx, (
                kode_program, kode_kegiatan, kode_output,
                kode_suboutput, kode_komponen, kode_akun,
                uraian_item, base_billions
            ) in enumerate(ANGGARAN_TEMPLATE):
                # Budget in IDR (billions * 1_000_000_000)
                total_idr = (base_billions * multiplier * Decimal("1000000000")).quantize(
                    Decimal("1")
                )
                # Volume/harga split: volume=1, harga=total for simplicity
                volume = Decimal("1.0000")
                harga_sat = total_idr

                kode_item = f"{kode_program}.{kode_kegiatan}.{kode_output}.{satker.kode_satker}.{idx + 1:03d}"

                _, created = Anggaran.objects.update_or_create(
                    satker=satker,
                    kode_item=kode_item,
                    kode_sts_history=kode_sts_history,
                    tahun_anggaran=TAHUN_ANGGARAN,
                    defaults={
                        "kode_program": kode_program,
                        "kode_kegiatan": kode_kegiatan,
                        "kode_output": kode_output,
                        "kode_suboutput": kode_suboutput,
                        "kode_komponen": kode_komponen,
                        "kode_akun": kode_akun,
                        "uraian_item": uraian_item,
                        "volume_keg": volume,
                        "sat_keg": "Paket",
                        "harga_sat": harga_sat,
                        "total": total_idr,
                        "synced_at": synced_at,
                    },
                )
                if created:
                    total_created += 1
                else:
                    total_updated += 1

        self.stdout.write(f"  Anggaran: {total_created} baru, {total_updated} diperbarui")

    # ── Realisasi ─────────────────────────────────────────────────────────────

    def _seed_realisasi(self, satker_list: list[Satker]) -> None:
        self.stdout.write("Seeding Realisasi...")
        total_created = 0
        total_updated = 0
        synced_at = django_timezone.now()

        for satker in satker_list:
            # Get total budget for this satker
            satker_total_budget = sum(
                item.total
                for item in Anggaran.objects.filter(
                    satker=satker, tahun_anggaran=TAHUN_ANGGARAN
                )
            )
            if satker_total_budget == 0:
                continue

            # Track cumulative disbursement to create realistic cumulative curve
            prev_cumulative = Decimal("0")
            spp_sequence = 1

            for month_idx, month in enumerate(MONTHS):
                target_rate = Decimal(str(MONTHLY_ABSORPTION_RATES[month_idx]))
                target_cumulative = satker_total_budget * target_rate
                month_disbursement = target_cumulative - prev_cumulative

                if month_disbursement <= 0:
                    continue

                # Split month's disbursement into 2-4 SPP transactions
                num_spp = random.randint(2, 4)
                amounts = self._split_amount(month_disbursement, num_spp)

                for i, amount in enumerate(amounts):
                    spp_day = random.randint(3, 25)
                    spm_day = min(spp_day + random.randint(2, 5), 28)
                    sp2d_day = min(spm_day + random.randint(1, 3), 28)

                    tgl_spp = date(TAHUN_ANGGARAN, month, spp_day)
                    tgl_spm = date(TAHUN_ANGGARAN, month, spm_day)
                    tgl_sp2d = date(TAHUN_ANGGARAN, month, sp2d_day)

                    id_spp = int(f"{satker.kode_satker}{TAHUN_ANGGARAN}{month:02d}{spp_sequence:04d}")
                    no_spp = f"SPP-{satker.kode_satker}-{TAHUN_ANGGARAN}-{month:02d}-{spp_sequence:04d}"
                    no_spm = f"SPM-{satker.kode_satker}-{TAHUN_ANGGARAN}-{month:02d}-{spp_sequence:04d}"
                    no_sp2d = f"SP2D-{satker.kode_satker}-{TAHUN_ANGGARAN}-{month:02d}-{spp_sequence:04d}"

                    _, created = Realisasi.objects.update_or_create(
                        satker=satker,
                        id_spp=id_spp,
                        tahun_anggaran=TAHUN_ANGGARAN,
                        defaults={
                            "kd_jns_spp": "LS",
                            "no_spp": no_spp,
                            "no_spm": no_spm,
                            "no_sp2d": no_sp2d,
                            "tgl_spp": tgl_spp,
                            "tgl_spm": tgl_spm,
                            "tgl_sp2d": tgl_sp2d,
                            "nilai_spm": amount,
                            "nilai_sp2d": amount,
                            "status_data": "SP2D",
                            "synced_at": synced_at,
                        },
                    )
                    if created:
                        total_created += 1
                    else:
                        total_updated += 1
                    spp_sequence += 1

                prev_cumulative = target_cumulative

        self.stdout.write(f"  Realisasi: {total_created} baru, {total_updated} diperbarui")

    # ── CapaianRO ─────────────────────────────────────────────────────────────

    def _seed_capaian(self, satker_list: list[Satker]) -> None:
        self.stdout.write("Seeding CapaianRO...")
        total_created = 0
        total_updated = 0
        synced_at = django_timezone.now()

        # Sub-output codes per satker (using the output codes from template)
        sub_output_codes = ["001.001.001", "001.002.001", "002.001.001", "002.002.001", "003.001.001"]

        for satker in satker_list:
            satker_total_budget = sum(
                item.total
                for item in Anggaran.objects.filter(
                    satker=satker, tahun_anggaran=TAHUN_ANGGARAN
                )
            )
            if satker_total_budget == 0:
                continue

            # Split budget evenly across sub-outputs for simplicity
            per_output_budget = (satker_total_budget / len(sub_output_codes)).quantize(Decimal("1"))

            for sub_output_kode in sub_output_codes:
                for month_idx, month in enumerate(MONTHS):
                    absorption_rate = MONTHLY_ABSORPTION_RATES[month_idx]
                    kode_periode = f"{TAHUN_ANGGARAN}-{month:02d}"

                    realisasi_amount = (
                        per_output_budget * Decimal(str(absorption_rate))
                    ).quantize(Decimal("1"))

                    # Progress capaian is slightly ahead of financial absorption
                    progress_pct = round(absorption_rate * 100 * random.uniform(1.0, 1.15), 2)
                    progress_pct = min(progress_pct, 100.0)

                    _, created = CapaianRO.objects.update_or_create(
                        satker=satker,
                        sub_output_kode=sub_output_kode,
                        kode_periode=kode_periode,
                        defaults={
                            "total_realisasi_sub_output": Decimal(str(round(absorption_rate, 4))),
                            "total_progress_capaian_ro": progress_pct,
                            "anggaran_belanja": per_output_budget,
                            "realisasi_belanja": realisasi_amount,
                            "synced_at": synced_at,
                        },
                    )
                    if created:
                        total_created += 1
                    else:
                        total_updated += 1

        self.stdout.write(f"  CapaianRO: {total_created} baru, {total_updated} diperbarui")

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _split_amount(total: Decimal, n: int) -> list[Decimal]:
        """Split a total amount into n roughly-equal parts with some randomness."""
        parts = []
        remaining = total
        for i in range(n - 1):
            # Each part is 60-110% of an equal split, keeping some randomness
            fraction = Decimal(str(random.uniform(0.6, 1.1) / (n - i)))
            amount = (total * fraction).quantize(Decimal("1"))
            amount = min(amount, remaining - Decimal("1000000") * (n - i - 1))
            amount = max(amount, Decimal("1000000"))
            parts.append(amount)
            remaining -= amount
        parts.append(max(remaining, Decimal("1000000")))
        return parts
