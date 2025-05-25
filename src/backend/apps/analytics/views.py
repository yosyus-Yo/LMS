from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, F, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, datetime
import openai
import os
import json
from django.conf import settings
from django.core.cache import cache

from .models import UserActivity, LearningMetric, SessionData, ChatbotInteraction
from .serializers import (
    UserActivitySerializer,
    LearningMetricSerializer,
    SessionDataSerializer,
    ChatbotInteractionSerializer,
    ChatbotQuestionSerializer,
    DashboardStatsSerializer,
    UserStatsSerializer,
    CourseStatsSerializer,
)
from ..courses.models import Course, Enrollment, Review
from ..users.permissions import IsAdminOrSelf

User = get_user_model()


class UserActivityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user activity
    """
    queryset = UserActivity.objects.all()
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return UserActivity.objects.all()
        return UserActivity.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )


class LearningMetricViewSet(viewsets.ModelViewSet):
    """
    API endpoint for learning metrics
    """
    queryset = LearningMetric.objects.all()
    serializer_class = LearningMetricSerializer
    permission_classes = [IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return LearningMetric.objects.all()
        
        if self.request.user.role == 'instructor':
            return LearningMetric.objects.filter(course__instructor=self.request.user)
        
        return LearningMetric.objects.filter(user=self.request.user)


class SessionDataViewSet(viewsets.ModelViewSet):
    """
    API endpoint for session data
    """
    queryset = SessionData.objects.all()
    serializer_class = SessionDataSerializer
    permission_classes = [IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return SessionData.objects.all()
        
        if self.request.user.role == 'instructor':
            return SessionData.objects.filter(course__instructor=self.request.user)
        
        return SessionData.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT')
        )
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """
        Start a new learning session
        """
        course_id = request.data.get('course_id')
        chapter_id = request.data.get('chapter_id')
        
        course = None
        chapter = None
        
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if chapter_id:
            try:
                from ..courses.models import Chapter
                chapter = Chapter.objects.get(id=chapter_id)
                # If course wasn't provided, get it from the chapter
                if not course:
                    course = chapter.module.course
            except Chapter.DoesNotExist:
                return Response(
                    {'error': 'Chapter not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Create session
        session = SessionData.objects.create(
            user=request.user,
            course=course,
            chapter=chapter,
            start_time=timezone.now(),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
        
        # Record activity
        if course:
            action = 'view_course'
            details = {'course_id': course.id, 'course_title': course.title}
            if chapter:
                action = 'view_chapter'
                details['chapter_id'] = chapter.id
                details['chapter_title'] = chapter.title
                
            UserActivity.objects.create(
                user=request.user,
                action=action,
                details=details,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        
        return Response(SessionDataSerializer(session).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        """
        End a learning session
        """
        session = self.get_object()
        
        if session.end_time:
            return Response(
                {'error': 'Session already ended'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.end_time = timezone.now()
        session.save()
        
        # Update learning metrics
        if session.course:
            try:
                enrollment = Enrollment.objects.get(user=request.user, course=session.course)
                metric, created = LearningMetric.objects.get_or_create(
                    user=request.user,
                    course=session.course,
                    enrollment=enrollment
                )
                
                # Update time spent
                if session.duration_seconds:
                    metric.time_spent += session.duration_seconds
                
                # Increment access count
                metric.access_count += 1
                
                # Calculate engagement score (simplified example)
                # In a real application, this would be more complex
                time_factor = min(session.duration_seconds / 300, 1) if session.duration_seconds else 0
                progress = enrollment.progress / 100 if enrollment.progress else 0
                metric.engagement_score = (time_factor * 0.6) + (progress * 0.4)
                
                metric.save()
                
            except Enrollment.DoesNotExist:
                # If user is not enrolled, we still track the session but don't update metrics
                pass
        
        return Response(SessionDataSerializer(session).data)


class ChatbotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for chatbot interactions
    """
    queryset = ChatbotInteraction.objects.all()
    serializer_class = ChatbotInteractionSerializer
    permission_classes = [IsAdminOrSelf]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return ChatbotInteraction.objects.all()
        return ChatbotInteraction.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def ask(self, request):
        """
        Send a question to the AI chatbot
        """
        serializer = ChatbotQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        question = serializer.validated_data['question']
        course_id = serializer.validated_data.get('course_id')
        context = serializer.validated_data.get('context', {})
        
        course = None
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Check if question is cached
        cache_key = f"chatbot_question_{hash(question)}_{course_id if course_id else 'general'}"
        cached_response = cache.get(cache_key)
        
        if cached_response:
            # If cached, create interaction record with cached answer
            interaction = ChatbotInteraction.objects.create(
                user=request.user,
                course=course,
                question=question,
                answer=cached_response,
                context=context
            )
            return Response({
                'id': interaction.id,
                'answer': cached_response,
                'source': 'cache'
            })
        
        # Prepare system message based on context
        system_message = "You are an AI learning assistant helping students with their questions."
        if course:
            system_message += f" The student is asking about the course '{course.title}'. "
            system_message += f"The course is about {course.description[:200]}... "
        
        # Add additional context if provided
        if context:
            if 'current_topic' in context:
                system_message += f"The current topic is {context['current_topic']}. "
            
            if 'learning_stage' in context:
                system_message += f"The student is at the {context['learning_stage']} stage. "
        
        # Call OpenAI API
        try:
            openai.api_key = settings.OPENAI_API_KEY
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": question}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content.strip()
            
            # Cache the response (15 minutes)
            cache.set(cache_key, answer, 60 * 15)
            
            # Create interaction record
            interaction = ChatbotInteraction.objects.create(
                user=request.user,
                course=course,
                question=question,
                answer=answer,
                context=context
            )
            
            return Response({
                'id': interaction.id,
                'answer': answer,
                'source': 'api'
            })
            
        except Exception as e:
            # Handle API errors
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """
        Submit feedback for a chatbot interaction
        """
        interaction = self.get_object()
        
        # Ensure user can only provide feedback for their own interactions
        if interaction.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You can only provide feedback for your own interactions'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        feedback = request.data.get('feedback')
        if feedback is None:
            return Response(
                {'error': 'Feedback is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            feedback = int(feedback)
            if feedback < 1 or feedback > 5:
                return Response(
                    {'error': 'Feedback must be between 1 and 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Feedback must be a number'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        interaction.feedback = feedback
        interaction.save()
        
        return Response({'success': True})


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard_stats(request):
    """
    Get stats for the admin dashboard
    """
    # Basic stats
    total_users = User.objects.count()
    active_users = User.objects.filter(
        is_active=True, 
        activities__timestamp__gte=timezone.now() - timedelta(days=30)
    ).distinct().count()
    total_courses = Course.objects.count()
    total_enrollments = Enrollment.objects.count()
    
    # Completion rate
    completed_enrollments = Enrollment.objects.filter(status='completed').count()
    completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # User roles distribution
    user_roles = User.objects.values('role').annotate(count=Count('id'))
    roles_dict = {item['role']: item['count'] for item in user_roles}
    
    # Course categories distribution
    from django.db.models import Count
    categories = Course.objects.values('categories__name').annotate(count=Count('id'))
    categories_dict = {item['categories__name']: item['count'] for item in categories if item['categories__name']}
    
    # Recent activities
    recent_activities = UserActivity.objects.order_by('-timestamp')[:10]
    
    # Popular courses
    popular_courses = list(Course.objects.annotate(
        enrollment_count=Count('enrollments')
    ).order_by('-enrollment_count')[:5].values('id', 'title', 'enrollment_count'))
    
    # Daily logins
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_logins = UserActivity.objects.filter(
        action='login',
        timestamp__gte=thirty_days_ago
    ).values('timestamp__date').annotate(
        count=Count('id')
    ).order_by('timestamp__date')
    
    daily_logins_list = [
        {
            'date': item['timestamp__date'].strftime('%Y-%m-%d'),
            'count': item['count']
        }
        for item in daily_logins
    ]
    
    # Enrollment trend
    enrollment_trend = Enrollment.objects.filter(
        enrolled_at__gte=thirty_days_ago
    ).values('enrolled_at__date').annotate(
        count=Count('id')
    ).order_by('enrolled_at__date')
    
    enrollment_trend_list = [
        {
            'date': item['enrolled_at__date'].strftime('%Y-%m-%d'),
            'count': item['count']
        }
        for item in enrollment_trend
    ]
    
    stats = {
        'total_users': total_users,
        'active_users': active_users,
        'total_courses': total_courses,
        'total_enrollments': total_enrollments,
        'completion_rate': completion_rate,
        'user_roles': roles_dict,
        'course_categories': categories_dict,
        'recent_activities': UserActivitySerializer(recent_activities, many=True).data,
        'popular_courses': popular_courses,
        'daily_logins': daily_logins_list,
        'enrollment_trend': enrollment_trend_list
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request, user_id=None):
    """
    Get stats for a specific user
    """
    # If user_id is provided, get stats for that user (admins only)
    if user_id and user_id != request.user.id:
        if not request.user.is_staff and request.user.role != 'admin':
            return Response(
                {'error': 'You do not have permission to view stats for this user'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        user = request.user
    
    # Basic enrollment stats
    enrollments = Enrollment.objects.filter(user=user)
    enrolled_courses = enrollments.count()
    completed_courses = enrollments.filter(status='completed').count()
    
    # Learning time
    learning_metrics = LearningMetric.objects.filter(user=user)
    total_learning_time = learning_metrics.aggregate(Sum('time_spent'))['time_spent__sum'] or 0
    
    # Progress
    progress_sum = enrollments.aggregate(Sum('progress'))['progress__sum'] or 0
    average_progress = progress_sum / enrolled_courses if enrolled_courses > 0 else 0
    
    # Course progress
    course_progress = []
    for enrollment in enrollments:
        course_progress.append({
            'course_id': enrollment.course.id,
            'course_title': enrollment.course.title,
            'progress': enrollment.progress,
            'status': enrollment.status
        })
    
    # Recent activities
    recent_activities = UserActivity.objects.filter(user=user).order_by('-timestamp')[:10]
    
    # Learning streak (simplified - in reality would be more complex)
    # Find consecutive days of activity
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily_activity = UserActivity.objects.filter(
        user=user,
        timestamp__gte=thirty_days_ago
    ).values('timestamp__date').distinct().order_by('-timestamp__date')
    
    # Simple streak calculation
    streak = 0
    if daily_activity:
        latest_date = timezone.now().date()
        for activity in daily_activity:
            activity_date = activity['timestamp__date']
            if (latest_date - activity_date).days <= 1:
                streak += 1
                latest_date = activity_date
            else:
                break
    
    stats = {
        'enrolled_courses': enrolled_courses,
        'completed_courses': completed_courses,
        'total_learning_time': total_learning_time,
        'average_progress': average_progress,
        'course_progress': course_progress,
        'recent_activities': UserActivitySerializer(recent_activities, many=True).data,
        'learning_streak': streak
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def course_stats(request, course_id):
    """
    Get stats for a specific course
    """
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if (course.instructor != request.user and 
        request.user.role != 'admin' and 
        not request.user.is_staff):
        
        # Students can only see stats for courses they're enrolled in
        if not Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'You do not have permission to view stats for this course'}, 
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Basic stats
    enrollments = Enrollment.objects.filter(course=course)
    total_enrollments = enrollments.count()
    active_learners = enrollments.filter(
        user__activities__timestamp__gte=timezone.now() - timedelta(days=30),
        user__activities__details__contains={'course_id': course.id}
    ).distinct().count()
    
    # Completion rate
    completed_enrollments = enrollments.filter(status='completed').count()
    completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
    
    # Average rating
    average_rating = Review.objects.filter(course=course).aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Enrollment trend
    thirty_days_ago = timezone.now() - timedelta(days=30)
    enrollment_trend = enrollments.filter(
        enrolled_at__gte=thirty_days_ago
    ).values('enrolled_at__date').annotate(
        count=Count('id')
    ).order_by('enrolled_at__date')
    
    enrollment_trend_list = [
        {
            'date': item['enrolled_at__date'].strftime('%Y-%m-%d'),
            'count': item['count']
        }
        for item in enrollment_trend
    ]
    
    # Completion trend
    completion_trend = enrollments.filter(
        completed_at__isnull=False,
        completed_at__gte=thirty_days_ago
    ).values('completed_at__date').annotate(
        count=Count('id')
    ).order_by('completed_at__date')
    
    completion_trend_list = [
        {
            'date': item['completed_at__date'].strftime('%Y-%m-%d'),
            'count': item['count']
        }
        for item in completion_trend
    ]
    
    # Student progress
    progress_counts = {
        '0-25': 0,
        '26-50': 0,
        '51-75': 0,
        '76-99': 0,
        '100': 0
    }
    
    for enrollment in enrollments:
        if enrollment.progress == 100:
            progress_counts['100'] += 1
        elif enrollment.progress >= 76:
            progress_counts['76-99'] += 1
        elif enrollment.progress >= 51:
            progress_counts['51-75'] += 1
        elif enrollment.progress >= 26:
            progress_counts['26-50'] += 1
        else:
            progress_counts['0-25'] += 1
    
    student_progress = [
        {'range': k, 'count': v} for k, v in progress_counts.items()
    ]
    
    # Ratings distribution
    ratings = Review.objects.filter(course=course).values('rating').annotate(count=Count('id'))
    ratings_dict = {f"{item['rating']}": item['count'] for item in ratings}
    
    stats = {
        'total_enrollments': total_enrollments,
        'active_learners': active_learners,
        'completion_rate': completion_rate,
        'average_rating': average_rating,
        'enrollment_trend': enrollment_trend_list,
        'completion_trend': completion_trend_list,
        'student_progress': student_progress,
        'ratings_distribution': ratings_dict
    }
    
    return Response(stats)