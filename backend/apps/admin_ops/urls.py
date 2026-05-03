from django.urls import path
from .views import (
    DashboardKPIsAPIView,
    GlobalSearchAPIView,
    AlertListAPIView, AlertActionAPIView, AlertConfigListCreateAPIView, AlertSummaryAPIView,
    TransactionListAPIView, TransactionDetailAPIView, TransactionActionAPIView,
    AnalyticsProductAPIView, AnalyticsZoneAPIView, AnalyticsTopSellersAPIView,
    AccountSearchAPIView, AccountDetailAPIView, AccountActionAPIView,
    MessageSendAPIView, MessageHistoryAPIView, MessageTemplateListAPIView, RecipientSearchAPIView, MessageInboxAPIView,
    ActivityLogAPIView, FlaggedAccountListAPIView, FlaggedAccountActionAPIView,
)

urlpatterns = [
    # Dashboard KPIs
    path('dashboard/kpis/', DashboardKPIsAPIView.as_view(), name='admin_kpis'),

    # Global Search
    path('search/', GlobalSearchAPIView.as_view(), name='admin_global_search'),

    # Alerts
    path('alerts/', AlertListAPIView.as_view(), name='admin_alerts'),
    path('alerts/summary/', AlertSummaryAPIView.as_view(), name='admin_alert_summary'),
    path('alerts/<int:pk>/', AlertActionAPIView.as_view(), name='admin_alert_action'),
    path('alerts/config/', AlertConfigListCreateAPIView.as_view(), name='admin_alert_config'),

    # Transactions
    path('transactions/', TransactionListAPIView.as_view(), name='admin_transactions'),
    path('transactions/<int:pk>/', TransactionDetailAPIView.as_view(), name='admin_transaction_detail'),
    path('transactions/<int:pk>/action/', TransactionActionAPIView.as_view(), name='admin_transaction_action'),

    # Analytics
    path('analytics/products/', AnalyticsProductAPIView.as_view(), name='admin_analytics_products'),
    path('analytics/zones/', AnalyticsZoneAPIView.as_view(), name='admin_analytics_zones'),
    path('analytics/top-sellers/', AnalyticsTopSellersAPIView.as_view(), name='admin_analytics_top_sellers'),

    # Account Management
    path('accounts/', AccountSearchAPIView.as_view(), name='admin_accounts'),
    path('accounts/<int:pk>/', AccountDetailAPIView.as_view(), name='admin_account_detail'),
    path('accounts/<int:pk>/action/', AccountActionAPIView.as_view(), name='admin_account_action'),

    # Messages
    path('messages/send/', MessageSendAPIView.as_view(), name='admin_message_send'),
    path('messages/history/', MessageHistoryAPIView.as_view(), name='admin_message_history'),
    path('messages/inbox/', MessageInboxAPIView.as_view(), name='admin_message_inbox'),
    path('messages/templates/', MessageTemplateListAPIView.as_view(), name='admin_message_templates'),
    path('messages/recipients/', RecipientSearchAPIView.as_view(), name='admin_recipient_search'),

    # Monitoring
    path('monitoring/activity-log/', ActivityLogAPIView.as_view(), name='admin_activity_log'),
    path('monitoring/flagged-accounts/', FlaggedAccountListAPIView.as_view(), name='admin_flagged_accounts'),
    path('monitoring/flagged-accounts/<int:pk>/', FlaggedAccountActionAPIView.as_view(), name='admin_flagged_action'),
]
