from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserActivity, LearningMetric, SessionData, ChatbotInteraction
from ..courses.models import Course, Chapter

User = get_user_model()


class UserActivitySerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'username', 'action', 'details',
            'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_username(self, obj):
        return obj.user.username


class LearningMetricSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningMetric
        fields = [
            'id', 'user', 'username', 'course', 'course_title', 'enrollment',
            'time_spent', 'access_count', 'engagement_score',
            'quiz_attempts', 'quiz_average_score',
            'assignment_completed', 'assignment_average_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_course_title(self, obj):
        return obj.course.title


class SessionDataSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    chapter_title = serializers.SerializerMethodField()
    
    class Meta:
        model = SessionData
        fields = [
            'id', 'user', 'username', 'course', 'course_title',
            'chapter', 'chapter_title', 'start_time', 'end_time',
            'duration_seconds', 'events', 'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'duration_seconds']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None
    
    def get_chapter_title(self, obj):
        return obj.chapter.title if obj.chapter else None


class ChatbotInteractionSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatbotInteraction
        fields = [
            'id', 'user', 'username', 'course', 'course_title',
            'question', 'answer', 'feedback', 'context', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_username(self, obj):
        return obj.user.username
    
    def get_course_title(self, obj):
        return obj.course.title if obj.course else None


class ChatbotQuestionSerializer(serializers.Serializer):
    """
    Serializer for sending questions to the chatbot
    """
    question = serializers.CharField(required=True)
    course_id = serializers.IntegerField(required=False, allow_null=True)
    context = serializers.JSONField(required=False)


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for admin dashboard statistics
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_enrollments = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    
    user_roles = serializers.DictField(child=serializers.IntegerField())
    course_categories = serializers.DictField(child=serializers.IntegerField())
    
    recent_activities = UserActivitySerializer(many=True)
    popular_courses = serializers.ListField(child=serializers.DictField())
    
    daily_logins = serializers.ListField(child=serializers.DictField())
    enrollment_trend = serializers.ListField(child=serializers.DictField())


class UserStatsSerializer(serializers.Serializer):
    """
    Serializer for user statistics
    """
    enrolled_courses = serializers.IntegerField()
    completed_courses = serializers.IntegerField()
    total_learning_time = serializers.IntegerField()  # in seconds
    average_progress = serializers.FloatField()  # percentage
    
    course_progress = serializers.ListField(child=serializers.DictField())
    recent_activities = UserActivitySerializer(many=True)
    learning_streak = serializers.IntegerField()  # days


class CourseStatsSerializer(serializers.Serializer):
    """
    Serializer for course statistics
    """
    total_enrollments = serializers.IntegerField()
    active_learners = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    average_rating = serializers.FloatField()
    
    enrollment_trend = serializers.ListField(child=serializers.DictField())
    completion_trend = serializers.ListField(child=serializers.DictField())
    student_progress = serializers.ListField(child=serializers.DictField())
    ratings_distribution = serializers.DictField(child=serializers.IntegerField())