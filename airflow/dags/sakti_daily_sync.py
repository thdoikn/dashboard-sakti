"""
Airflow DAG: sakti_daily_sync

Daily synchronization of SAKTI budget and disbursement data for all active
OIKN satker. Runs at 02:00 WIB every day.

Architecture note (Option A from CLAUDE.md):
  Airflow tasks access the sakti_data MySQL database directly via Django ORM.
  This requires DJANGO_SETTINGS_MODULE and PYTHONPATH to be set in the Airflow
  container so that Django apps and sakti_client are importable.

  Django is imported lazily inside each task function (not at module level) to
  avoid circular imports and slow DAG parse times — Airflow parses DAG files
  frequently and should not pay the full Django startup cost on every parse.

Security note (no application-level auth per CLAUDE.md v1 scope):
  This is an internal pipeline with no user-facing authentication. Access to the
  Airflow UI is restricted at the network/infrastructure level.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Any

import pendulum
from airflow import DAG
from airflow.decorators import task
from airflow.utils.trigger_rule import TriggerRule

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Django setup
# ---------------------------------------------------------------------------
# The DJANGO_SETTINGS_MODULE env var must be set in the Airflow container
# (via docker-compose environment:) before this module is imported. We provide
# a fallback here for local testing, but the container override takes priority.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# django.setup() is called lazily inside task functions, not here at module
# level, to keep DAG parse times fast. Each task function that needs Django ORM
# calls _ensure_django_setup() at the top.

_django_ready = False


def _ensure_django_setup() -> None:
    """Idempotently initialise Django ORM. Safe to call multiple times."""
    global _django_ready
    if not _django_ready:
        import django
        django.setup()
        _django_ready = True


# ---------------------------------------------------------------------------
# Failure notification placeholder
# ---------------------------------------------------------------------------

def notify_failure_placeholder(context: dict) -> None:
    """
    Placeholder for DAG-level failure notifications.

    Wire this up to Slack / email in a future version by replacing the body
    of this function. The signature matches Airflow's on_failure_callback
    interface.
    """
    task_instance = context.get("task_instance")
    task_id = task_instance.task_id if task_instance else "unknown"
    logger.error(
        "DAG failure | dag_run_id=%s | task=%s | error=%s",
        context.get("run_id"),
        task_id,
        context.get("exception"),
    )


# ---------------------------------------------------------------------------
# DAG default arguments
# ---------------------------------------------------------------------------

default_args: dict[str, Any] = {
    "owner": "dkb-team",
    "retries": 3,
    "retry_delay": timedelta(minutes=2),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=30),
    "depends_on_past": False,
}

# ---------------------------------------------------------------------------
# DAG definition
# ---------------------------------------------------------------------------

with DAG(
    dag_id="sakti_daily_sync",
    default_args=default_args,
    description=(
        "Daily sync of SAKTI budget and disbursement data "
        "for all active OIKN satker"
    ),
    schedule_interval="0 2 * * *",
    start_date=pendulum.datetime(2026, 1, 1, tz="Asia/Jakarta"),
    catchup=False,
    tags=["sakti", "oikn", "daily"],
    on_failure_callback=notify_failure_placeholder,
) as dag:

    # -----------------------------------------------------------------------
    # Task 1: Get the list of active satker from the database.
    # This drives the dynamic task mapping in fetch_data_ang, fetch_spp_header,
    # and fetch_capaian_ro — always read from the DB, never hardcode.
    # -----------------------------------------------------------------------

    @task()
    def get_active_satker() -> list[dict]:
        """
        Query all active satker from the sakti_data database.

        Returns a list of dicts so Airflow can serialise the result to XCom
        and use it as the expansion input for dynamic task mapping.
        """
        _ensure_django_setup()
        from apps.satker.models import Satker  # noqa: PLC0415

        satker_qs = Satker.objects.filter(aktif=True).values(
            "id", "kode_satker", "nama_satker"
        )
        result = list(satker_qs)
        logger.info("Found %d active satker for this DAG run.", len(result))
        return result

    # -----------------------------------------------------------------------
    # Task 2: Fetch refSts (status history reference data).
    # -----------------------------------------------------------------------

    @task()
    def fetch_ref_sts() -> list[dict]:
        """
        Call SaktiClient.get_ref_sts() and return the data list.

        The returned list is stored in XCom. It is not currently consumed by
        downstream tasks in v1 (kept for observability and future use).
        """
        _ensure_django_setup()
        from sakti_client.client import SaktiClient  # noqa: PLC0415

        client = SaktiClient()
        result = client.get_ref_sts()
        data = result.get("data", [])
        logger.info("fetch_ref_sts: retrieved %d records.", len(data))
        return data

    # -----------------------------------------------------------------------
    # Task 3: Fetch refAdmin + refUraian (code reference data).
    # -----------------------------------------------------------------------

    @task()
    def fetch_ref_admin_uraian() -> dict:
        """
        Call SaktiClient.get_ref_admin() and get_ref_uraian(), return combined dict.

        The returned dict has two keys:
          - 'ref_admin': list of satker admin reference records
          - 'ref_uraian': list of code → uraian mapping records
        """
        _ensure_django_setup()
        from sakti_client.client import SaktiClient  # noqa: PLC0415

        client = SaktiClient()
        ref_admin = client.get_ref_admin()
        ref_uraian = client.get_ref_uraian()

        admin_data = ref_admin.get("data", [])
        uraian_data = ref_uraian.get("data", [])

        logger.info(
            "fetch_ref_admin_uraian: refAdmin=%d records, refUraian=%d records.",
            len(admin_data),
            len(uraian_data),
        )
        return {"ref_admin": admin_data, "ref_uraian": uraian_data}

    # -----------------------------------------------------------------------
    # Task 4: Fetch budget allocation data (dataAng) — dynamically mapped.
    # One task instance runs per active satker.
    # -----------------------------------------------------------------------

    @task()
    def fetch_data_ang(satker_info: dict) -> dict:
        """
        Fetch SAKTI dataAng for a single satker.

        Called once per active satker via .expand(satker_info=active_satker_list).
        Returns a dict with 'satker_id' and 'data' keys for use by
        normalize_and_load_anggaran.
        """
        _ensure_django_setup()
        from sakti_client.client import SaktiClient  # noqa: PLC0415

        kode_satker = satker_info["kode_satker"]
        satker_id = satker_info["id"]

        client = SaktiClient(kode_kl=kode_satker)
        result = client.get_data_ang()
        data = result.get("data", [])

        logger.info(
            "fetch_data_ang: satker=%s (%s) → %d records.",
            kode_satker,
            satker_info.get("nama_satker", ""),
            len(data),
        )
        return {"satker_id": satker_id, "kode_satker": kode_satker, "data": data}

    # -----------------------------------------------------------------------
    # Task 5: Fetch SPP/SPM/SP2D payment headers (sppHeader) — dynamically mapped.
    # -----------------------------------------------------------------------

    @task()
    def fetch_spp_header(satker_info: dict) -> dict:
        """
        Fetch SAKTI sppHeader for a single satker.

        Called once per active satker via .expand(satker_info=active_satker_list).
        Returns a dict with 'satker_id' and 'data' keys for use by
        normalize_and_load_realisasi.
        """
        _ensure_django_setup()
        from sakti_client.client import SaktiClient  # noqa: PLC0415

        kode_satker = satker_info["kode_satker"]
        satker_id = satker_info["id"]

        client = SaktiClient(kode_kl=kode_satker)
        result = client.get_spp_header()
        data = result.get("data", [])

        logger.info(
            "fetch_spp_header: satker=%s (%s) → %d records.",
            kode_satker,
            satker_info.get("nama_satker", ""),
            len(data),
        )
        return {"satker_id": satker_id, "kode_satker": kode_satker, "data": data}

    # -----------------------------------------------------------------------
    # Task 6: Fetch capaianRO (performance achievement) — dynamically mapped.
    # -----------------------------------------------------------------------

    @task()
    def fetch_capaian_ro(satker_info: dict) -> dict:
        """
        Fetch SAKTI capaianRO for a single satker.

        Called once per active satker via .expand(satker_info=active_satker_list).
        Returns a dict with 'satker_id' and 'data' keys for use by
        normalize_and_load_capaian.
        """
        _ensure_django_setup()
        from sakti_client.client import SaktiClient  # noqa: PLC0415

        kode_satker = satker_info["kode_satker"]
        satker_id = satker_info["id"]

        client = SaktiClient(kode_kl=kode_satker)
        result = client.get_capaian_ro()
        data = result.get("data", [])

        logger.info(
            "fetch_capaian_ro: satker=%s (%s) → %d records.",
            kode_satker,
            satker_info.get("nama_satker", ""),
            len(data),
        )
        return {"satker_id": satker_id, "kode_satker": kode_satker, "data": data}

    # -----------------------------------------------------------------------
    # Task 7: Normalise and upsert Anggaran records.
    # Receives the list of mapped results from fetch_data_ang.
    # -----------------------------------------------------------------------

    @task()
    def normalize_and_load_anggaran(anggaran_batches: list[dict]) -> int:
        """
        Upsert Anggaran records from the fetch_data_ang dynamic-mapped results.

        anggaran_batches is a list of dicts produced by fetch_data_ang, one per
        active satker:  [{'satker_id': 1, 'kode_satker': '...', 'data': [...]}, ...]

        Uses update_or_create (never blind insert) keyed on:
          (satker_id, kode_item, kode_sts_history, tahun_anggaran)

        Returns the total number of rows processed.
        """
        _ensure_django_setup()
        from django.utils import timezone  # noqa: PLC0415

        from apps.anggaran.models import Anggaran  # noqa: PLC0415

        tahun_anggaran = datetime.now().year
        total_rows = 0

        if not anggaran_batches:
            logger.warning("normalize_and_load_anggaran: received empty batch list.")
            return 0

        for batch in anggaran_batches:
            if not batch:
                continue

            satker_id: int = batch.get("satker_id")
            kode_satker: str = batch.get("kode_satker", "")
            records: list[dict] = batch.get("data") or []

            if not records:
                logger.info(
                    "normalize_and_load_anggaran: no data for satker_id=%s (%s), skipping.",
                    satker_id,
                    kode_satker,
                )
                continue

            batch_count = 0
            now = timezone.now()

            for item in records:
                # Guard against malformed items
                if not isinstance(item, dict):
                    continue

                kode_item = item.get("kd_item", "")
                kode_sts_history = item.get("kd_sts_history", "")

                if not kode_item:
                    logger.warning(
                        "normalize_and_load_anggaran: item missing kd_item for satker=%s, skipping.",
                        kode_satker,
                    )
                    continue

                # Safely convert string amounts to Decimal-compatible values.
                def _dec(val: Any, fallback: str = "0") -> str:
                    """Return a clean string representation for DecimalField."""
                    try:
                        return str(val) if val is not None else fallback
                    except (TypeError, ValueError):
                        return fallback

                Anggaran.objects.update_or_create(
                    satker_id=satker_id,
                    kode_item=kode_item,
                    kode_sts_history=kode_sts_history,
                    tahun_anggaran=tahun_anggaran,
                    defaults={
                        "kode_program": item.get("kd_program", ""),
                        "kode_kegiatan": item.get("kd_kegiatan", ""),
                        "kode_output": item.get("kd_output", ""),
                        "kode_suboutput": item.get("kd_suboutput", ""),
                        "kode_komponen": item.get("kd_komponen", ""),
                        "kode_akun": item.get("kd_akun", ""),
                        "uraian_item": item.get("uraian", ""),
                        "volume_keg": _dec(item.get("volume"), "0"),
                        "sat_keg": item.get("sat", ""),
                        "harga_sat": _dec(item.get("harga_sat"), "0"),
                        "total": _dec(item.get("total"), "0"),
                        "synced_at": now,
                    },
                )
                batch_count += 1

            total_rows += batch_count
            logger.info(
                "normalize_and_load_anggaran: upserted %d records for satker_id=%s (%s).",
                batch_count,
                satker_id,
                kode_satker,
            )

        logger.info(
            "normalize_and_load_anggaran: total rows upserted across all satker = %d.",
            total_rows,
        )
        return total_rows

    # -----------------------------------------------------------------------
    # Task 8: Normalise and upsert Realisasi records.
    # Receives the list of mapped results from fetch_spp_header.
    # -----------------------------------------------------------------------

    @task()
    def normalize_and_load_realisasi(realisasi_batches: list[dict]) -> int:
        """
        Upsert Realisasi records from the fetch_spp_header dynamic-mapped results.

        realisasi_batches is a list of dicts produced by fetch_spp_header.

        Uses update_or_create keyed on:
          (satker_id, id_spp, tahun_anggaran)

        Returns the total number of rows processed.
        """
        _ensure_django_setup()
        from django.utils import timezone  # noqa: PLC0415

        from apps.realisasi.models import Realisasi  # noqa: PLC0415

        tahun_anggaran = datetime.now().year
        total_rows = 0

        if not realisasi_batches:
            logger.warning("normalize_and_load_realisasi: received empty batch list.")
            return 0

        for batch in realisasi_batches:
            if not batch:
                continue

            satker_id: int = batch.get("satker_id")
            kode_satker: str = batch.get("kode_satker", "")
            records: list[dict] = batch.get("data") or []

            if not records:
                logger.info(
                    "normalize_and_load_realisasi: no data for satker_id=%s (%s), skipping.",
                    satker_id,
                    kode_satker,
                )
                continue

            batch_count = 0
            now = timezone.now()

            for item in records:
                if not isinstance(item, dict):
                    continue

                id_spp = item.get("id_spp")
                if id_spp is None:
                    logger.warning(
                        "normalize_and_load_realisasi: item missing id_spp for satker=%s, skipping.",
                        kode_satker,
                    )
                    continue

                def _date(val: Any) -> "datetime | None":
                    """Parse YYYY-MM-DD date string, return None if blank/invalid."""
                    if not val:
                        return None
                    try:
                        return datetime.strptime(str(val), "%Y-%m-%d").date()
                    except ValueError:
                        return None

                def _dec(val: Any, fallback: str = "0") -> str:
                    try:
                        return str(val) if val is not None else fallback
                    except (TypeError, ValueError):
                        return fallback

                Realisasi.objects.update_or_create(
                    satker_id=satker_id,
                    id_spp=int(id_spp),
                    tahun_anggaran=tahun_anggaran,
                    defaults={
                        "kd_jns_spp": item.get("kd_jns_spp", ""),
                        "no_spp": item.get("no_spp", ""),
                        "no_spm": item.get("no_spm", ""),
                        "no_sp2d": item.get("no_sp2d", ""),
                        "tgl_spp": _date(item.get("tgl_spp")),
                        "tgl_spm": _date(item.get("tgl_spm")),
                        "tgl_sp2d": _date(item.get("tgl_sp2d")),
                        "nilai_spm": _dec(item.get("nilai_spm"), "0"),
                        "nilai_sp2d": _dec(item.get("nilai_sp2d"), "0"),
                        "status_data": item.get("status_data", ""),
                        "synced_at": now,
                    },
                )
                batch_count += 1

            total_rows += batch_count
            logger.info(
                "normalize_and_load_realisasi: upserted %d records for satker_id=%s (%s).",
                batch_count,
                satker_id,
                kode_satker,
            )

        logger.info(
            "normalize_and_load_realisasi: total rows upserted across all satker = %d.",
            total_rows,
        )
        return total_rows

    # -----------------------------------------------------------------------
    # Task 9: Normalise and upsert CapaianRO records.
    # Receives the list of mapped results from fetch_capaian_ro.
    # -----------------------------------------------------------------------

    @task()
    def normalize_and_load_capaian(capaian_batches: list[dict]) -> int:
        """
        Upsert CapaianRO records from the fetch_capaian_ro dynamic-mapped results.

        capaian_batches is a list of dicts produced by fetch_capaian_ro.

        Uses update_or_create keyed on:
          (satker_id, sub_output_kode, kode_periode)

        Returns the total number of rows processed.
        """
        _ensure_django_setup()
        from django.utils import timezone  # noqa: PLC0415

        from apps.capaian.models import CapaianRO  # noqa: PLC0415

        total_rows = 0

        if not capaian_batches:
            logger.warning("normalize_and_load_capaian: received empty batch list.")
            return 0

        for batch in capaian_batches:
            if not batch:
                continue

            satker_id: int = batch.get("satker_id")
            kode_satker: str = batch.get("kode_satker", "")
            records: list[dict] = batch.get("data") or []

            if not records:
                logger.info(
                    "normalize_and_load_capaian: no data for satker_id=%s (%s), skipping.",
                    satker_id,
                    kode_satker,
                )
                continue

            batch_count = 0
            now = timezone.now()

            for item in records:
                if not isinstance(item, dict):
                    continue

                sub_output_kode = item.get("kd_sub_output", "")
                kode_periode = item.get("kd_periode", "")

                if not sub_output_kode or not kode_periode:
                    logger.warning(
                        "normalize_and_load_capaian: item missing kd_sub_output or kd_periode "
                        "for satker=%s, skipping.",
                        kode_satker,
                    )
                    continue

                def _dec(val: Any, fallback: str = "0") -> str:
                    try:
                        return str(val) if val is not None else fallback
                    except (TypeError, ValueError):
                        return fallback

                CapaianRO.objects.update_or_create(
                    satker_id=satker_id,
                    sub_output_kode=sub_output_kode,
                    kode_periode=kode_periode,
                    defaults={
                        "total_realisasi_sub_output": _dec(item.get("total_realisasi"), "0"),
                        "total_progress_capaian_ro": item.get("total_progress"),
                        "anggaran_belanja": _dec(item.get("anggaran_belanja"), "0"),
                        "realisasi_belanja": _dec(item.get("realisasi_belanja"), "0"),
                        "synced_at": now,
                    },
                )
                batch_count += 1

            total_rows += batch_count
            logger.info(
                "normalize_and_load_capaian: upserted %d records for satker_id=%s (%s).",
                batch_count,
                satker_id,
                kode_satker,
            )

        logger.info(
            "normalize_and_load_capaian: total rows upserted across all satker = %d.",
            total_rows,
        )
        return total_rows

    # -----------------------------------------------------------------------
    # Task 10: Normalise and upsert Referensi records.
    # Receives the combined ref_admin + ref_uraian dict.
    # -----------------------------------------------------------------------

    @task()
    def normalize_and_load_referensi(ref_data: dict) -> int:
        """
        Upsert Referensi records from the fetch_ref_admin_uraian result.

        ref_data has the shape:
          {'ref_admin': [...satker info...], 'ref_uraian': [...code maps...]}

        ref_uraian items already have the correct schema: {jenis, kode, uraian}.
        ref_admin items (satker info) are converted to jenis='satker' records.

        Uses update_or_create keyed on (jenis, kode).

        Returns the total number of rows upserted.
        """
        _ensure_django_setup()
        from apps.anggaran.models import Referensi  # noqa: PLC0415

        if not ref_data:
            logger.warning("normalize_and_load_referensi: received empty ref_data.")
            return 0

        ref_uraian: list[dict] = ref_data.get("ref_uraian") or []
        ref_admin: list[dict] = ref_data.get("ref_admin") or []

        total_rows = 0

        # Upsert refUraian items (program/kegiatan/output/sub_output/komponen/akun)
        for item in ref_uraian:
            if not isinstance(item, dict):
                continue
            jenis = item.get("jenis", "")
            kode = item.get("kode", "")
            uraian = item.get("uraian", "")
            if not jenis or not kode:
                continue
            Referensi.objects.update_or_create(
                jenis=jenis,
                kode=kode,
                defaults={"uraian": uraian},
            )
            total_rows += 1

        # Upsert refAdmin items as jenis='satker' reference records.
        # Stored here for cross-reference lookups; the authoritative satker list
        # lives in the Satker table and is managed via Django Admin.
        for item in ref_admin:
            if not isinstance(item, dict):
                continue
            kode = item.get("kd_satker", "")
            uraian = item.get("nm_satker", "")
            if not kode:
                continue
            Referensi.objects.update_or_create(
                jenis="satker",
                kode=kode,
                defaults={"uraian": uraian},
            )
            total_rows += 1

        logger.info(
            "normalize_and_load_referensi: upserted %d total reference records.",
            total_rows,
        )
        return total_rows

    # -----------------------------------------------------------------------
    # Task 11: Log the sync result to SyncLog.
    # trigger_rule=ALL_DONE ensures this runs even when upstream tasks fail.
    # -----------------------------------------------------------------------

    @task(trigger_rule=TriggerRule.ALL_DONE)
    def log_sync_result(
        dag_run_id: str,
        ang_count: int,
        real_count: int,
        cap_count: int,
        ref_count: int,
    ) -> None:
        """
        Write a SyncLog entry for each data type processed in this DAG run.

        Runs regardless of upstream task success/failure (TriggerRule.ALL_DONE).
        Records are keyed on (dag_run_id, task_name) so re-triggering a run
        overwrites the previous log entries rather than duplicating them.

        Uses update_or_create so rerunning the same DAG run_id is idempotent.
        """
        _ensure_django_setup()
        from django.utils import timezone  # noqa: PLC0415

        from apps.sync_log.models import SyncLog  # noqa: PLC0415

        now = timezone.now()

        # Map task label → row count (None means the upstream task may have failed)
        task_results = {
            "normalize_and_load_anggaran": ang_count,
            "normalize_and_load_realisasi": real_count,
            "normalize_and_load_capaian": cap_count,
            "normalize_and_load_referensi": ref_count,
        }

        for task_name, row_count in task_results.items():
            # A count of None (task failed/skipped) maps to STATUS_FAILED.
            # A non-negative int maps to STATUS_SUCCESS.
            if row_count is None or (isinstance(row_count, int) and row_count < 0):
                status = SyncLog.STATUS_FAILED
                error_msg = "Upstream task did not return a valid row count."
            else:
                status = SyncLog.STATUS_SUCCESS
                error_msg = None

            SyncLog.objects.update_or_create(
                dag_run_id=dag_run_id,
                task_name=task_name,
                defaults={
                    "status": status,
                    "row_count": row_count if isinstance(row_count, int) else None,
                    "error_message": error_msg,
                    "started_at": now,
                    "finished_at": now,
                    "satker": None,  # This is an aggregate task, not per-satker
                },
            )

        logger.info(
            "log_sync_result: dag_run_id=%s | anggaran=%s | realisasi=%s | capaian=%s | referensi=%s",
            dag_run_id,
            ang_count,
            real_count,
            cap_count,
            ref_count,
        )

    # -----------------------------------------------------------------------
    # DAG wiring — task dependencies and dynamic mapping
    # -----------------------------------------------------------------------

    # Step 1: Independent upstream tasks
    active_satker_list = get_active_satker()
    ref_sts = fetch_ref_sts()
    ref_admin = fetch_ref_admin_uraian()

    # Step 2: Dynamic mapping — one task instance per active satker
    ang_batches = fetch_data_ang.expand(satker_info=active_satker_list)
    spp_batches = fetch_spp_header.expand(satker_info=active_satker_list)
    cap_batches = fetch_capaian_ro.expand(satker_info=active_satker_list)

    # Step 3: Normalise and upsert — aggregate the mapped results
    ang_count = normalize_and_load_anggaran(anggaran_batches=ang_batches)
    real_count = normalize_and_load_realisasi(realisasi_batches=spp_batches)
    cap_count = normalize_and_load_capaian(capaian_batches=cap_batches)
    ref_count = normalize_and_load_referensi(ref_data=ref_admin)

    # Step 4: Log results — always runs, even on upstream failure
    log_sync_result(
        dag_run_id="{{ run_id }}",
        ang_count=ang_count,
        real_count=real_count,
        cap_count=cap_count,
        ref_count=ref_count,
    )
