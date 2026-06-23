"""
OIDC authentication backend for SAKTI-OIKN.

Keycloak sends job-title strings like "DIREKTUR DATA DAN KECERDASAN BUATAN"
or "KEPALA BIRO SUMBER DAYA MANUSIA DAN HUBUNGAN MASYARAKAT". This module
normalises those strings to match the DB's EselonI / EselonII names using
Jaccard similarity on significant words, then syncs user profile on every login.

Name normalisation: Keycloak often sends names in ALL CAPS (e.g. "I GUSTI CIPTA").
These are title-cased on create/update.
"""

import re
import unicodedata

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError, transaction
from mozilla_django_oidc.auth import OIDCAuthenticationBackend

User = get_user_model()

# ---------------------------------------------------------------------------
# Title-prefix substitutions: convert personal-title → org-unit prefix
# so the string can be matched against EselonI / EselonII names.
# ---------------------------------------------------------------------------
_TITLE_SUBS = [
    (r"^DIREKTUR\b",                 "DIREKTORAT"),
    (r"^KEPALA\s+DIREKTORAT\b",      "DIREKTORAT"),
    (r"^KEPALA\s+BIRO\b",            "BIRO"),
    (r"^KEPALA\s+BAGIAN\b",          "BAGIAN"),
    (r"^KEPALA\s+PUSAT\b",           "PUSAT"),
    (r"^KEPALA\s+",                  ""),
    # "SEKRETARIS OTORITA …" → the unit is just "Sekretariat"
    (r"^SEKRETARIS\s+OTORITA\b.*",   "SEKRETARIAT"),
    (r"^SEKRETARIS\b",               "SEKRETARIAT"),
    # "DEPUTI BIDANG …" stays as-is — matches EselonI directly
]


def _normalize(s: str) -> str:
    """Strip diacritics, uppercase, keep only letters/digits/spaces."""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return s.upper().strip()


def _significant_words(s: str) -> set:
    """Return words of 4+ chars — short words (DAN, DI, KE …) are noise."""
    return {w for w in re.findall(r"[A-Z]{4,}", s)}


def _preprocess_sso(raw: str) -> str:
    """Apply title-prefix substitutions to make the string look like an org-unit name."""
    s = _normalize(raw)
    for pattern, replacement in _TITLE_SUBS:
        s, count = re.subn(pattern, replacement, s, flags=re.IGNORECASE)
        if count:
            break
    return s.strip()


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _best_match(raw_value: str, queryset):
    """Return the best-matching object (must have a .nama field) above Jaccard 0.45."""
    if not raw_value:
        return None
    processed = _preprocess_sso(raw_value)
    words_input = _significant_words(processed)
    best_obj, best_score = None, 0.45
    for obj in queryset:
        words_db = _significant_words(_normalize(obj.nama))
        score = _jaccard(words_input, words_db)
        if score > best_score:
            best_score, best_obj = score, obj
    return best_obj


def _match_eselon_ii(raw_value: str):
    from apps.organisasi.models import EselonII
    cached = cache.get("org:eselon_ii")
    if cached is None:
        cached = list(EselonII.objects.select_related("eselon_i").all())
        cache.set("org:eselon_ii", cached, timeout=3600)
    return _best_match(raw_value, cached)


def _match_eselon_i(raw_value: str):
    from apps.organisasi.models import EselonI
    cached = cache.get("org:eselon_i")
    if cached is None:
        cached = list(EselonI.objects.all())
        cache.set("org:eselon_i", cached, timeout=3600)
    return _best_match(raw_value, cached)


# ---------------------------------------------------------------------------
# Username generator
# ---------------------------------------------------------------------------

def generate_username(email: str) -> str:
    base = email.split("@")[0]
    username, n = base, 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{n}"
        n += 1
    return username


# ---------------------------------------------------------------------------
# OIDC backend
# ---------------------------------------------------------------------------

class SaktiOIDCBackend(OIDCAuthenticationBackend):
    """
    Keycloak OIDC backend for SAKTI-OIKN.

    Claim mapping expected from Keycloak attribute mappers:
      unit_kerja   → Eselon II title string (e.g. "DIREKTUR DATA DAN KECERDASAN BUATAN")
      satuan_kerja → Eselon I  title string (e.g. "DEPUTI BIDANG TRANSFORMASI HIJAU DAN DIGITAL")
      jabatan      → functional job title
      nip          → employee ID
    """

    def get_userinfo(self, access_token, id_token, payload):
        userinfo = super().get_userinfo(access_token, id_token, payload)
        # Some Keycloak configurations put role claims only in the token payload
        for key in ("resource_access", "realm_access"):
            if key not in userinfo and key in payload:
                userinfo[key] = payload[key]
        return userinfo

    def filter_users_by_claims(self, claims):
        email = claims.get("email")
        if not email:
            return self.UserModel.objects.none()
        return self.UserModel.objects.filter(email__iexact=email)

    # ── Role mapping ─────────────────────────────────────────────────────────

    def _map_role(self, claims) -> str:
        from django.conf import settings as s
        realm_roles  = claims.get("realm_access", {}).get("roles", [])
        client_roles = (
            claims.get("resource_access", {})
                  .get(getattr(s, "OIDC_RP_CLIENT_ID", ""), {})
                  .get("roles", [])
        )
        all_roles = set(realm_roles) | set(client_roles)
        if "sakti-admin" in all_roles or "admin" in all_roles:
            return User.Role.ADMIN
        if "sakti-operator" in all_roles or "operator" in all_roles:
            return User.Role.OPERATOR
        return User.Role.VIEWER

    # ── Profile extraction ────────────────────────────────────────────────────

    def _extract_profile(self, claims: dict) -> dict:
        raw_uk = claims.get("unit_kerja", "") or claims.get("direktorat", "")
        raw_uo = claims.get("satuan_kerja", "") or claims.get("kedeputian", "")
        return {
            "nip":             claims.get("nip", ""),
            "jabatan":         claims.get("jabatan", ""),
            "raw_direktorat":  raw_uk,
            "raw_kedeputian":  raw_uo,
            "unit_eselon_ii":  _match_eselon_ii(raw_uk),
            "unit_eselon_i":   _match_eselon_i(raw_uo),
        }

    # ── Name normalisation: ALL CAPS → Title Case ─────────────────────────────

    @staticmethod
    def _title_case(s: str) -> str:
        if not s:
            return s
        return s.title() if s == s.upper() else s

    def _extract_names(self, claims: dict) -> tuple[str, str]:
        """
        Return (first_name, last_name), title-cased.

        Handles the common Keycloak case where family_name is set but
        given_name is absent — splits the 'name' claim using family_name as anchor.
        """
        given  = (claims.get("given_name") or "").strip()
        family = (claims.get("family_name") or "").strip()
        if not given:
            full = (claims.get("name") or "").strip()
            if full:
                if family and full.upper().endswith(" " + family.upper()):
                    given = full[:-(len(family) + 1)].strip()
                elif " " in full:
                    parts = full.rsplit(" ", 1)
                    given = parts[0]
                    if not family:
                        family = parts[1]
                else:
                    given = full
        return self._title_case(given), self._title_case(family)

    # ── Create / Update ───────────────────────────────────────────────────────

    def create_user(self, claims):
        email   = claims.get("email", "")
        profile = self._extract_profile(claims)
        first_name, last_name = self._extract_names(claims)

        for attempt in range(5):
            username = generate_username(email)
            try:
                with transaction.atomic():
                    user = self.UserModel.objects.create_user(
                        username   = username,
                        email      = email,
                        first_name = first_name,
                        last_name  = last_name,
                        role       = self._map_role(claims),
                        **profile,
                    )
                    user.set_unusable_password()
                    user.save(update_fields=["password"])
                    return user
            except IntegrityError:
                if attempt == 4:
                    raise
        return None

    def update_user(self, user, claims):
        """Sync all profile fields from Keycloak on every login."""
        changed = []
        profile = self._extract_profile(claims)

        for field, value in profile.items():
            current = getattr(user, field, None)
            if field.startswith("unit_"):
                # FK field: compare by pk
                cur_pk = current.pk if current is not None else None
                new_pk = value.pk if value is not None else None
                if cur_pk != new_pk:
                    setattr(user, field, value)
                    changed.append(field)
            else:
                if value and current != value:
                    setattr(user, field, value)
                    changed.append(field)

        first_name, last_name = self._extract_names(claims)
        for attr, val in [("first_name", first_name), ("last_name", last_name)]:
            if val and getattr(user, attr) != val:
                setattr(user, attr, val)
                changed.append(attr)

        new_role = self._map_role(claims)
        if user.role != new_role:
            user.role = new_role
            changed.append("role")

        if changed:
            user.save(update_fields=changed)
        return user
