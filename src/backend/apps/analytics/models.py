from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..courses.models import Course, Chapter, Enrollment

User = get_user_model()


class UserActivity(models.Model):
    """
    Track user activity in the platform
    """
    ACTION_CHOICES = (
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view_course', 'View Course'),
        ('view_chapter', 'View Chapter'),
        ('complete_chapter', 'Complete Chapter'),
        ('enroll_course', 'Enroll Course'),
        ('complete_course', 'Complete Course'),
        ('search', 'Search'),
        ('download', 'Download Resource'),
        ('review', 'Review Course'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.JSONField(null=True, blank=True)  # Additional info about the action
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name_plural = 'User Activities'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"


class LearningMetric(models.Model):
    """
    Learning metrics for users in courses
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_metrics')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='learning_metrics')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='learning_metrics')
    
    # Time spent learning in seconds
    time_spent = models.PositiveIntegerField(default=0)
    
    # Frequency of logins/access
    access_count = models.PositiveIntegerField(default=0)
    
    # Engagement score (calculated based on multiple factors)
    engagement_score = models.FloatField(default=0.0)
    
    # Quiz performance metrics
    quiz_attempts = models.PositiveIntegerField(default=0)
    quiz_average_score = models.FloatField(default=0.0)
    
    # Assignment completion metrics
    assignment_completed = models.PositiveIntegerField(default=0)
    assignment_average_score = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user.username}'s metrics for {self.course.title}"


class SessionData(models.Model):
    """
    Detailed data about user learning sessions
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Session events (video pauses, seeks, speed changes, etc.)
    events = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s session - {self.start_time}"
    
    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            self.duration_seconds = int((self.end_time - self.start_time).total_seconds())
        super().save(*args, **kwargs)


class ChatbotInteraction(models.Model):
    """
    Record interactions with the AI chatbot
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatbot_interactions')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chatbot_interactions', 
                               null=True, blank=True)
    
    question = models.TextField()
    answer = models.TextField()
    feedback = models.IntegerField(null=True, blank=True)  # User rating of the answer
    
    context = models.JSONField(null=True, blank=True)  # Context of the interaction (page, content, etc.)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - Q&A - {self.timestamp}"