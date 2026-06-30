"""
Authentication views for SAKTI-OIKN.

OIDCCallbackView: receives { code, redirect_uri } from the React frontend,
exchanges the code with Keycloak server-to-server, then returns SimpleJWT
tokens identical in shape to a normal login response.
"""

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


class OIDCCallbackView(APIView):
    """
    POST /api/auth/oidc/callback/
    Body: { code, redirect_uri }

    Exchanges the Keycloak authorization code for tokens, finds/creates the
    user from claims, and returns our own SimpleJWT tokens.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code         = request.data.get("code")
        redirect_uri = request.data.get("redirect_uri")

        if not code:
            return Response({"error": "code is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not redirect_uri:
            return Response({"error": "redirect_uri is required"}, status=status.HTTP_400_BAD_REQUEST)

        from .oidc import SaktiOIDCBackend

        backend = SaktiOIDCBackend()
        try:
            token_info = backend.get_token({
                "client_id":     settings.OIDC_RP_CLIENT_ID,
                "client_secret": settings.OIDC_RP_CLIENT_SECRET,
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  redirect_uri,
            })
            access_token = token_info.get("access_token")
            id_token     = token_info.get("id_token")

            if not id_token:
                return Response(
                    {"error": "id_token not received from SSO"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payload = backend.verify_token(id_token, nonce=None)
            user    = backend.get_or_create_user(access_token, id_token, payload)

        except Exception as exc:
            return Response(
                {"error": f"SSO failed: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user is None:
            return Response(
                {"error": "Akun Anda tidak memiliki akses ke aplikasi ini. Hubungi administrator untuk mendapatkan role yang sesuai."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.is_active:
            return Response({"error": "Account is inactive"}, status=status.HTTP_403_FORBIDDEN)

        # Record the login in the audit trail (best-effort). request.user is
        # still anonymous at this point, so pass the resolved user explicitly.
        try:
            from apps.activity_log.models import ActivityLog
            from apps.activity_log.services import log_activity
            log_activity(
                request,
                ActivityLog.Action.LOGIN,
                "Masuk ke dashboard via SSO OIKN",
                user=user,
            )
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user": _serialize_user(user),
        })


class CurrentUserView(APIView):
    """GET /api/auth/me/ — returns the current user's profile.

    When AUTH_DISABLED (testing mode) and there is no real session, returns a
    synthetic superadmin profile so the SPA renders fully without login.
    """

    def get_permissions(self):
        if getattr(settings, "AUTH_DISABLED", False):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        if getattr(settings, "AUTH_DISABLED", False) and not request.user.is_authenticated:
            return Response(_mock_user())
        return Response(_serialize_user(request.user))


class AuthConfigView(APIView):
    """GET /api/auth/config/ — public; tells the frontend whether login is required."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"auth_enabled": not getattr(settings, "AUTH_DISABLED", False)})


def _mock_user() -> dict:
    """Synthetic profile returned in AUTH_DISABLED testing mode (no real session)."""
    return {
        "id":            0,
        "username":      "tester",
        "email":         "tester@example.local",
        "first_name":    "Test",
        "last_name":     "User",
        "display_name":  "Test User (No Auth)",
        "role":          "superadmin",
        "nip":           "",
        "jabatan":       "",
        "unit_eselon_i":  None,
        "unit_eselon_ii": None,
        "last_login":    None,
        "date_joined":   "2026-01-01T00:00:00+00:00",
        "is_active":     True,
    }


def _serialize_user(user) -> dict:
    return {
        "id":            user.id,
        "username":      user.username,
        "email":         user.email,
        "first_name":    user.first_name,
        "last_name":     user.last_name,
        "display_name":  user.display_name,
        "role":          user.role,
        "nip":           user.nip,
        "jabatan":       user.jabatan,
        "unit_eselon_i": {
            "id":   user.unit_eselon_i.id,
            "nama": user.unit_eselon_i.nama,
            "jenis": user.unit_eselon_i.jenis,
        } if user.unit_eselon_i else None,
        "unit_eselon_ii": {
            "id":   user.unit_eselon_ii.id,
            "nama": user.unit_eselon_ii.nama,
        } if user.unit_eselon_ii else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "date_joined": user.date_joined.isoformat(),
        "is_active":   user.is_active,
    }
