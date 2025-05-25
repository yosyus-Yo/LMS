from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserActivityViewSet,
    LearningMetricViewSet,
    SessionDataViewSet,
    ChatbotViewSet,
    admin_dashboard_stats,
    user_stats,
    course_stats,
)

router = DefaultRouter()
router.register(r'activities', UserActivityViewSet)
router.register(r'metrics', LearningMetricViewSet)
router.register(r'sessions', SessionDataViewSet)
router.register(r'chatbot', ChatbotViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/admin/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('dashboard/user/', user_stats, name='user-stats'),
    path('dashboard/user/<int:user_id>/', user_stats, name='user-stats-detail'),
    path('dashboard/course/<int:course_id>/', course_stats, name='course-stats'),
]