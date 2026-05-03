from django.apps import AppConfig


class AdminOpsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.admin_ops'

    def ready(self):
        import apps.admin_ops.signals
