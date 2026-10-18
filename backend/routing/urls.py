"""
URL configuration for routing app.
"""
from django.urls import path
from routing.views import RouteAnalyzeView, GeocodeSearchView, HealthCheckView

urlpatterns = [
    path("routes/analyze/", RouteAnalyzeView.as_view(), name="routes-analyze"),
    path("geocoding/search/", GeocodeSearchView.as_view(), name="geocoding-search"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
]
