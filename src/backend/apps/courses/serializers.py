from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category,
    Course,
    Module,
    Chapter,
    Enrollment,
    Progress,
    Review,
)
from ..users.serializers import UserSerializer

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'slug', 'parent', 'created_at']


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = [
            'id', 'title', 'module', 'content_type', 'content', 'order',
            'is_free', 'duration_seconds', 'formatted_duration',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['formatted_duration']


class ModuleSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    total_chapters = serializers.IntegerField(read_only=True)
    total_duration = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'course', 'order', 
            'total_chapters', 'total_duration', 'chapters',
            'created_at', 'updated_at'
        ]


class ModuleListSerializer(serializers.ModelSerializer):
    total_chapters = serializers.IntegerField(read_only=True)
    total_duration = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'course', 'order', 
            'total_chapters', 'total_duration',
            'created_at', 'updated_at'
        ]


class CourseListSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    total_enrollments = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    total_chapters = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'instructor', 
            'categories', 'level', 'featured_image', 'featured_video',
            'price', 'is_published', 'duration', 'total_enrollments',
            'total_modules', 'total_chapters', 'created_at', 'updated_at'
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    modules = ModuleListSerializer(many=True, read_only=True)
    total_enrollments = serializers.IntegerField(read_only=True)
    total_modules = serializers.IntegerField(read_only=True)
    total_chapters = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'instructor', 
            'categories', 'level', 'featured_image', 'featured_video',
            'price', 'is_published', 'learning_objectives', 'prerequisites',
            'audience', 'duration', 'total_enrollments', 'total_modules',
            'total_chapters', 'created_at', 'updated_at', 'modules'
        ]


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'categories', 'level',
            'featured_image', 'featured_video', 'price', 'is_published',
            'learning_objectives', 'prerequisites', 'audience', 'duration'
        ]
    
    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        course = Course.objects.create(
            instructor=self.context['request'].user,
            **validated_data
        )
        for category in categories:
            course.categories.add(category)
        return course


class EnrollmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = [
            'id', 'user', 'course', 'status', 'progress',
            'enrolled_at', 'completed_at'
        ]
        read_only_fields = ['enrolled_at', 'completed_at']


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['course']
    
    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data.get('course')
        
        # Check if enrollment already exists
        if Enrollment.objects.filter(user=user, course=course).exists():
            raise serializers.ValidationError("User is already enrolled in this course")
        
        return Enrollment.objects.create(user=user, course=course)


class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = [
            'id', 'enrollment', 'chapter', 'status', 'position',
            'started_at', 'completed_at', 'last_accessed'
        ]
        read_only_fields = ['started_at', 'completed_at', 'last_accessed']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'course', 'user', 'rating', 'comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['course', 'rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        course = validated_data.get('course')
        
        # Check if user is enrolled in the course
        if not Enrollment.objects.filter(user=user, course=course).exists():
            raise serializers.ValidationError("You must be enrolled in the course to leave a review")
        
        # Update existing review if it exists
        try:
            review = Review.objects.get(user=user, course=course)
            review.rating = validated_data.get('rating')
            review.comment = validated_data.get('comment')
            review.save()
            return review
        except Review.DoesNotExist:
            return Review.objects.create(user=user, **validated_data)