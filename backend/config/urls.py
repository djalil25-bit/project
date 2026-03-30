from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.farms.urls')),
    path('api/v1/', include('apps.catalog.urls')),
    path('api/v1/', include('apps.pricing.urls')),
    path('api/v1/', include('apps.cart.urls')),
    path('api/v1/', include('apps.orders.urls')),
    path('api/v1/', include('apps.logistics.urls')),
    path('api/v1/dashboards/', include('apps.dashboards.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/complaints/', include('apps.complaints.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
