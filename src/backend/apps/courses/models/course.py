"""
Course models for the AI-LMS platform.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.users.models import User


class Category(models.Model):
    """Category model for organizing courses."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Course(models.Model):
    """Course model representing a complete educational course."""
    
    class Status(models.TextChoices):
        """Course status options."""
        DRAFT = 'draft', _('Draft')
        PUBLISHED = 'published', _('Published')
        ARCHIVED = 'archived', _('Archived')
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=255, blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='courses')
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_free = models.BooleanField(default=False)
    prerequisites = models.TextField(blank=True)
    learning_outcomes = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    language = models.CharField(max_length=50, default='English')
    duration_minutes = models.PositiveIntegerField(default=0)  # Total duration in minutes
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)
    enrollment_count = models.PositiveIntegerField(default=0)
    completion_percentage = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Module(models.Model):
    """Module model representing a section within a course."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Chapter(models.Model):
    """Chapter model representing a lesson within a module."""
    
    class ChapterType(models.TextChoices):
        """Chapter type options."""
        VIDEO = 'video', _('Video')
        TEXT = 'text', _('Text')
        PDF = 'pdf', _('PDF')
        QUIZ = 'quiz', _('Quiz')
        ASSIGNMENT = 'assignment', _('Assignment')
    
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=15, choices=ChapterType.choices, default=ChapterType.TEXT)
    content = models.TextField(blank=True)  # For text content
    file = models.FileField(upload_to='chapter_files/', null=True, blank=True)  # For PDF, video files
    video_url = models.URLField(blank=True)  # For external videos (YouTube, Vimeo)
    duration_minutes = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    is_free_preview = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.module.course.title} - {self.module.title} - {self.title}"


class Enrollment(models.Model):
    """Enrollment model representing a student enrolled in a course."""
    
    class Status(models.TextChoices):
        """Enrollment status options."""
        ACTIVE = 'active', _('Active')
        COMPLETED = 'completed', _('Completed')
        DROPPED = 'dropped', _('Dropped')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    progress = models.PositiveIntegerField(default=0)  # Progress percentage
    completed_chapters = models.JSONField(default=list, blank=True)
    last_accessed_chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, blank=True)
    enrollment_date = models.DateTimeField(auto_now_add=True)
    completion_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user.email} enrolled in {self.course.title}"


class Quiz(models.Model):
    """Quiz model for assessments within courses."""
    chapter = models.OneToOneField(Chapter, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=0)  # 0 means no time limit
    pass_percentage = models.PositiveIntegerField(default=70)
    is_randomized = models.BooleanField(default=False)
    show_answers = models.BooleanField(default=True)
    max_attempts = models.PositiveIntegerField(default=0)  # 0 means unlimited attempts
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Quiz: {self.title}"


class Question(models.Model):
    """Question model for quiz questions."""
    
    class QuestionType(models.TextChoices):
        """Question type options."""
        MULTIPLE_CHOICE = 'multiple_choice', _('Multiple Choice')
        SINGLE_CHOICE = 'single_choice', _('Single Choice')
        TRUE_FALSE = 'true_false', _('True/False')
        SHORT_ANSWER = 'short_answer', _('Short Answer')
        ESSAY = 'essay', _('Essay')
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QuestionType.choices)
    explanation = models.TextField(blank=True)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Question: {self.question_text[:30]}..."


class Answer(models.Model):
    """Answer model for quiz question options."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    explanation = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Answer for {self.question.question_text[:20]}..."


class QuizAttempt(models.Model):
    """Quiz attempt model for tracking student quiz submissions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    passed = models.BooleanField(default=False)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    attempt_number = models.PositiveIntegerField(default=1)
    answers = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'quiz', 'attempt_number']
    
    def __str__(self):
        return f"{self.user.email}'s attempt #{self.attempt_number} for {self.quiz.title}"


class Review(models.Model):
    """Review model for course ratings and feedback."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField()  # 1-5 star rating
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"Review by {self.user.email} for {self.course.title}"