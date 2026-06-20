"""
Unit tests for SaktiClient and TokenManager.

All HTTP calls are mocked via unittest.mock — no network required, no Django
test runner needed. Run with:

    cd backend
    python -m pytest sakti_client/tests/test_client.py -v
    # or
    python -m unittest sakti_client.tests.test_client

These tests cover:
  1. TokenManager — set/get/clear basics.
  2. TokenManager.reset_token — happy path (mocked HTTP).
  3. SaktiClient._get — bootstraps token via resetToken when none is stored.
  4. SaktiClient._get — stores the new token returned in the response body.
  5. SaktiClient._get — detects "Token Expired" → resets → retries successfully.
  6. SaktiClient.get_ref_sts — full happy-path integration (mocked HTTP).
"""

import unittest
from unittest.mock import MagicMock, call, patch

from sakti_client.auth import TokenManager
from sakti_client.client import SaktiClient, TokenExpiredError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_response(body: dict, status_code: int = 200) -> MagicMock:
    """Build a mock requests.Response with .json() returning body."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = body
    mock_resp.raise_for_status = MagicMock()  # no-op (won't raise)
    return mock_resp


# ---------------------------------------------------------------------------
# TokenManager tests
# ---------------------------------------------------------------------------

class TestTokenManager(unittest.TestCase):
    """Unit tests for TokenManager — no HTTP involved."""

    def setUp(self):
        self.tm = TokenManager()

    def test_initial_state_is_none(self):
        self.assertIsNone(self.tm.get_token())

    def test_set_get(self):
        self.tm.set_token("abc123")
        self.assertEqual(self.tm.get_token(), "abc123")

    def test_set_replaces_existing(self):
        self.tm.set_token("first")
        self.tm.set_token("second")
        self.assertEqual(self.tm.get_token(), "second")

    def test_clear(self):
        self.tm.set_token("abc123")
        self.tm.clear_token()
        self.assertIsNone(self.tm.get_token())

    def test_token_manager_set_get_clear(self):
        """Explicit combined set → get → clear cycle (covers the named test case)."""
        tm = TokenManager()
        self.assertIsNone(tm.get_token())
        tm.set_token("tok-xyz")
        self.assertEqual(tm.get_token(), "tok-xyz")
        tm.clear_token()
        self.assertIsNone(tm.get_token())

    @patch("sakti_client.auth.requests.get")
    def test_reset_token_happy_path(self, mock_get):
        """reset_token() GETs the resetToken URL and stores the returned token."""
        mock_get.return_value = _make_response({"status": "Ok", "token": "fresh-token"})

        result = self.tm.reset_token(
            reset_url="http://localhost:8000/sitp-monsakti-omspan/webservice/resetToken/ANG/refSts/999",
            api_key="dummy-key",
        )

        self.assertEqual(result, "fresh-token")
        self.assertEqual(self.tm.get_token(), "fresh-token")
        mock_get.assert_called_once()
        call_kwargs = mock_get.call_args
        self.assertIn("x-Gateway-APIKey", call_kwargs.kwargs.get("headers", {}))

    @patch("sakti_client.auth.requests.get")
    def test_reset_token_returns_none_on_network_error(self, mock_get):
        """reset_token() returns None and does not raise on connection errors."""
        import requests as req
        mock_get.side_effect = req.ConnectionError("refused")

        result = self.tm.reset_token(
            reset_url="http://localhost:8000/resetToken/ANG/refSts/999",
            api_key="dummy-key",
        )

        self.assertIsNone(result)
        self.assertIsNone(self.tm.get_token())


# ---------------------------------------------------------------------------
# SaktiClient tests
# ---------------------------------------------------------------------------

class TestSaktiClient(unittest.TestCase):
    """Tests for SaktiClient with all HTTP calls mocked."""

    def _make_client(self) -> SaktiClient:
        return SaktiClient(kode_kl="999")

    # -- test 1: bootstraps token via resetToken when none is stored ----------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_get_issues_reset_when_no_token(self, mock_auth_get, mock_session_cls):
        """
        When no token is stored, _get() must call resetToken first,
        then use the returned token in the Authorization header.
        """
        # resetToken call returns a fresh token
        mock_auth_get.return_value = _make_response(
            {"status": "Ok", "token": "bootstrap-token"}
        )

        # Data request succeeds and returns a new token for next call
        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()
        session_instance.get.return_value = _make_response(
            {"status": "Ok", "data": [{"id": 1}], "token": "next-token"}
        )

        client = self._make_client()
        result = client._get("ref_sts")

        # resetToken was called to bootstrap
        mock_auth_get.assert_called_once()
        reset_url_used = mock_auth_get.call_args.args[0]
        self.assertIn("resetToken", reset_url_used)

        # The data GET was made with the bootstrap token
        session_instance.get.assert_called_once()
        headers_used = session_instance.get.call_args.kwargs.get("headers", {})
        self.assertEqual(headers_used.get("Authorization"), "Bearer bootstrap-token")

        self.assertEqual(result["data"], [{"id": 1}])

    # -- test 2: stores new token from response body -------------------------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_get_stores_new_token_from_response(self, mock_auth_get, mock_session_cls):
        """
        After a successful response, the 'token' field in the body must be
        stored in TokenManager for the next request.
        """
        mock_auth_get.return_value = _make_response(
            {"status": "Ok", "token": "initial-token"}
        )

        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()
        session_instance.get.return_value = _make_response(
            {"status": "Ok", "data": [], "token": "stored-for-next"}
        )

        client = self._make_client()
        client._get("ref_sts")

        self.assertEqual(client.token_manager.get_token(), "stored-for-next")

    # -- test 3: token expired → reset → retry successfully ------------------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_token_expired_triggers_reset_and_retry(self, mock_auth_get, mock_session_cls):
        """
        When the first response body contains {"status": "Token Expired"},
        _get() must call resetToken and retry the data request exactly once.
        """
        # First resetToken (bootstrap): returns a token that is already expired
        # Second resetToken (after expiry detection): returns a fresh token
        mock_auth_get.side_effect = [
            _make_response({"status": "Ok", "token": "expired-token"}),
            _make_response({"status": "Ok", "token": "fresh-after-reset"}),
        ]

        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()
        # First data call → Token Expired; second → success
        session_instance.get.side_effect = [
            _make_response({"status": "Token Expired", "data": []}),
            _make_response({"status": "Ok", "data": [{"k": "v"}], "token": "final-token"}),
        ]

        client = self._make_client()
        result = client._get("ref_sts")

        # resetToken called twice: once for bootstrap, once after expiry
        self.assertEqual(mock_auth_get.call_count, 2)
        # Data endpoint called twice: once with expired token, once with fresh
        self.assertEqual(session_instance.get.call_count, 2)
        self.assertEqual(result["data"], [{"k": "v"}])
        self.assertEqual(client.token_manager.get_token(), "final-token")

    # -- test 4: token expired and reset also fails --------------------------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_token_expired_raises_when_reset_also_fails(self, mock_auth_get, mock_session_cls):
        """
        If resetToken fails after token expiry, _get() must raise TokenExpiredError.
        """
        # Bootstrap succeeds; second reset (after expiry) fails
        mock_auth_get.side_effect = [
            _make_response({"status": "Ok", "token": "first-token"}),
            _make_response({"status": "Ok"}),  # missing 'token' field → None
        ]

        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()
        session_instance.get.return_value = _make_response(
            {"status": "Token Expired", "data": []}
        )

        client = self._make_client()
        with self.assertRaises(TokenExpiredError):
            client._get("ref_sts")

    # -- test 5: get_ref_sts happy path (public method) ----------------------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_get_ref_sts_success(self, mock_auth_get, mock_session_cls):
        """
        get_ref_sts() returns the 'data' list from a successful mock response.
        """
        fixture_data = [
            {"kd_sts_history": "SH001", "tgl_status": "2026-01-15", "status": "FINAL"}
        ]

        mock_auth_get.return_value = _make_response(
            {"status": "Ok", "token": "tok-001"}
        )
        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()
        session_instance.get.return_value = _make_response(
            {"status": "Ok", "data": fixture_data, "token": "tok-002"}
        )

        client = self._make_client()
        result = client.get_ref_sts()

        self.assertEqual(result["status"], "Ok")
        self.assertEqual(len(result["data"]), 1)
        self.assertEqual(result["data"][0]["kd_sts_history"], "SH001")

    # -- test 6: no token at all, resetToken fails → TokenExpiredError -------

    @patch("sakti_client.client.requests.Session")
    @patch("sakti_client.auth.requests.get")
    def test_get_raises_when_initial_reset_fails(self, mock_auth_get, mock_session_cls):
        """
        If resetToken returns no token on first call, _get() raises TokenExpiredError
        without ever calling the data endpoint.
        """
        mock_auth_get.return_value = _make_response({"status": "Ok"})  # no 'token'

        session_instance = mock_session_cls.return_value
        session_instance.headers = MagicMock()

        client = self._make_client()
        with self.assertRaises(TokenExpiredError):
            client._get("ref_sts")

        # Data endpoint must never be called
        session_instance.get.assert_not_called()


if __name__ == "__main__":
    unittest.main()
