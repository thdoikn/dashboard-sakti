from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CurrentUserView, OIDCCallbackView

urlpatterns = [
    path("oidc/callback/", OIDCCallbackView.as_view(), name="oidc-callback"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
]
