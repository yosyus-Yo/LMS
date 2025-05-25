from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class Category(models.Model):
    """
    Course categories (e.g., Programming, Data Science, Web Development)
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # CSS class for the icon
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Course(models.Model):
    """
    Main course model
    """
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    categories = models.ManyToManyField(Category, related_name='courses')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    featured_image = models.ImageField(upload_to='course_images/', blank=True, null=True)
    featured_video = models.URLField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_published = models.BooleanField(default=False)
    
    # Course metadata
    learning_objectives = models.JSONField(blank=True, null=True)  # List of learning objectives
    prerequisites = models.TextField(blank=True, null=True)
    audience = models.TextField(blank=True, null=True)  # Target audience description
    duration = models.CharField(max_length=50, blank=True, null=True)  # e.g., "10 hours", "4 weeks"
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def total_enrollments(self):
        return self.enrollments.count()
    
    @property
    def total_modules(self):
        return self.modules.count()
    
    @property
    def total_chapters(self):
        return Chapter.objects.filter(module__course=self).count()


class Module(models.Model):
    """
    Course module (a group of chapters)
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    order = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    @property
    def total_chapters(self):
        return self.chapters.count()
    
    @property
    def total_duration(self):
        # Calculate total duration of all chapters in the module
        return sum(chapter.duration_seconds for chapter in self.chapters.all() if chapter.duration_seconds)


class Chapter(models.Model):
    """
    Course chapter (individual lesson)
    """
    CONTENT_TYPE_CHOICES = (
        ('video', 'Video'),
        ('quiz', 'Quiz'),
        ('reading', 'Reading'),
        ('assignment', 'Assignment'),
    )
    
    title = models.CharField(max_length=200)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='chapters')
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content = models.JSONField()  # Structured content based on content_type
    order = models.PositiveIntegerField(default=0)
    is_free = models.BooleanField(default=False)  # Preview chapter
    duration_seconds = models.PositiveIntegerField(default=0)  # Duration in seconds
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['module', 'order']
    
    def __str__(self):
        return f"{self.module.title} - {self.title}"
    
    @property
    def formatted_duration(self):
        # Format seconds to "HH:MM:SS" or "MM:SS"
        minutes, seconds = divmod(self.duration_seconds, 60)
        hours, minutes = divmod(minutes, 60)
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        return f"{minutes:02d}:{seconds:02d}"


class Enrollment(models.Model):
    """
    User enrollment in a course
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('dropped', 'Dropped'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    progress = models.FloatField(default=0.0)  # Percentage of completion (0-100)
    
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'course']
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"


class Progress(models.Model):
    """
    User progress on individual chapters
    """
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )
    
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='chapter_progress')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='student_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    position = models.PositiveIntegerField(default=0)  # Last position in video (in seconds)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['enrollment', 'chapter']
    
    def __str__(self):
        return f"{self.enrollment.user.username} - {self.chapter.title}"


class Review(models.Model):
    """
    Course review
    """
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()  # 1-5 stars
    comment = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'course']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}'s review for {self.course.title}"