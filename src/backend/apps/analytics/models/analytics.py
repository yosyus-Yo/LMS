"""
Analytics models for the AI-LMS platform.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.users.models import User
from apps.courses.models import Course, Chapter, Quiz


class UserActivity(models.Model):
    """User activity tracking model."""
    
    class ActivityType(models.TextChoices):
        """Activity type options."""
        LOGIN = 'login', _('Login')
        LOGOUT = 'logout', _('Logout')
        COURSE_VIEW = 'course_view', _('Course View')
        CHAPTER_VIEW = 'chapter_view', _('Chapter View')
        QUIZ_START = 'quiz_start', _('Quiz Start')
        QUIZ_SUBMIT = 'quiz_submit', _('Quiz Submit')
        DOWNLOAD = 'download', _('Download')
        SEARCH = 'search', _('Search')
        OTHER = 'other', _('Other')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    context = models.JSONField(default=dict, blank=True)  # Additional context data
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=20, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('user activity')
        verbose_name_plural = _('user activities')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"


class LearningProgress(models.Model):
    """Learning progress tracking model."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='learning_progress')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='learning_progress')
    viewed = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    last_position_seconds = models.PositiveIntegerField(default=0)  # For video chapters
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'chapter']
        ordering = ['course', 'chapter']
    
    def __str__(self):
        return f"{self.user.email} progress on {self.chapter.title}"


class ChatbotInteraction(models.Model):
    """Chatbot interaction tracking model."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatbot_interactions')
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='chatbot_interactions')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name='chatbot_interactions')
    user_query = models.TextField()
    ai_response = models.TextField()
    feedback_helpful = models.BooleanField(null=True, blank=True)
    feedback_comment = models.TextField(blank=True)
    context = models.JSONField(default=dict, blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Chat with {self.user.email} at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"


class UserMetric(models.Model):
    """User-level metrics for analytics dashboards."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='metrics')
    courses_enrolled = models.PositiveIntegerField(default=0)
    courses_completed = models.PositiveIntegerField(default=0)
    avg_course_completion_time_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_learning_time_seconds = models.PositiveIntegerField(default=0)
    avg_quiz_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    login_count = models.PositiveIntegerField(default=0)
    last_login = models.DateTimeField(null=True, blank=True)
    engagement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # Calculated metric
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('user metric')
        verbose_name_plural = _('user metrics')
    
    def __str__(self):
        return f"Metrics for {self.user.email}"


class CourseMetric(models.Model):
    """Course-level metrics for analytics dashboards."""
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='metrics')
    enrollment_count = models.PositiveIntegerField(default=0)
    completion_count = models.PositiveIntegerField(default=0)
    dropout_count = models.PositiveIntegerField(default=0)
    avg_completion_time_days = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_review_count = models.PositiveIntegerField(default=0)
    avg_quiz_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    engagement_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('course metric')
        verbose_name_plural = _('course metrics')
    
    def __str__(self):
        return f"Metrics for {self.course.title}"


class RecommendationLog(models.Model):
    """Logs for AI-based recommendations."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    recommended_course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='recommendations')
    recommendation_reason = models.CharField(max_length=255)
    recommendation_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    features_used = models.JSONField(default=list)
    was_clicked = models.BooleanField(default=False)
    was_enrolled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Recommendation for {self.user.email}: {self.recommended_course.title}"