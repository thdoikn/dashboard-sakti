from django.apps import AppConfig


class MockSaktiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.mock_sakti"
    verbose_name = "Mock SAKTI API Server"
