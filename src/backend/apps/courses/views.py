from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import (
    Category,
    Course,
    Module,
    Chapter,
    Enrollment,
    Progress,
    Review,
)
from .serializers import (
    CategorySerializer,
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateSerializer,
    ModuleSerializer,
    ChapterSerializer,
    EnrollmentSerializer,
    EnrollmentCreateSerializer,
    ProgressSerializer,
    ReviewSerializer,
    ReviewCreateSerializer,
)
from ..users.permissions import IsInstructorOrReadOnly, IsEnrolledOrInstructor


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for course categories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()


class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for courses
    """
    queryset = Course.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'categories__name', 'instructor__username']
    ordering_fields = ['created_at', 'title', 'price']
    ordering = ['-created_at']
    lookup_field = 'slug'
    permission_classes = [IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = Course.objects.all()
        
        # Only show published courses unless user is staff, admin, or the instructor
        if not (self.request.user.is_staff or self.request.user.role == 'admin'):
            if self.request.user.role == 'instructor':
                queryset = queryset.filter(
                    is_published=True
                ) | queryset.filter(
                    instructor=self.request.user
                )
            else:
                queryset = queryset.filter(is_published=True)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by instructor
        instructor = self.request.query_params.get('instructor')
        if instructor:
            queryset = queryset.filter(instructor__username=instructor)
        
        # Filter by price (free courses)
        free = self.request.query_params.get('free')
        if free and free.lower() == 'true':
            queryset = queryset.filter(price=0)
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CourseCreateSerializer
        return CourseDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, slug=None):
        """
        Enroll the current user in the course
        """
        course = self.get_object()
        serializer = EnrollmentCreateSerializer(
            data={'course': course.id},
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Successfully enrolled'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, slug=None):
        """
        Get all reviews for a course
        """
        course = self.get_object()
        reviews = Review.objects.filter(course=course)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def review(self, request, slug=None):
        """
        Create or update a review for a course
        """
        course = self.get_object()
        serializer = ReviewCreateSerializer(
            data={'course': course.id, **request.data},
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        """
        Get courses created by the current instructor
        """
        if request.user.role != 'instructor' and not request.user.is_staff:
            return Response(
                {'error': 'You must be an instructor to view your courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        courses = Course.objects.filter(instructor=request.user)
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def enrolled(self, request):
        """
        Get courses in which the current user is enrolled
        """
        enrollments = Enrollment.objects.filter(user=request.user)
        courses = [enrollment.course for enrollment in enrollments]
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)


class ModuleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for course modules
    """
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsInstructorOrReadOnly]
    
    def get_queryset(self):
        course_slug = self.request.query_params.get('course')
        if course_slug:
            return Module.objects.filter(course__slug=course_slug)
        return Module.objects.all()
    
    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        
        # Check if the user is the instructor of the course
        if course.instructor != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied(
                'You do not have permission to add modules to this course'
            )
        
        # Set the order if not provided
        if 'order' not in serializer.validated_data:
            last_module = Module.objects.filter(course=course).order_by('-order').first()
            order = 1 if not last_module else last_module.order + 1
            serializer.save(order=order)
        else:
            serializer.save()


class ChapterViewSet(viewsets.ModelViewSet):
    """
    API endpoint for course chapters
    """
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [IsInstructorOrReadOnly]
    
    def get_queryset(self):
        module_id = self.request.query_params.get('module')
        if module_id:
            return Chapter.objects.filter(module_id=module_id)
        return Chapter.objects.all()
    
    def perform_create(self, serializer):
        module = serializer.validated_data['module']
        course = module.course
        
        # Check if the user is the instructor of the course
        if course.instructor != self.request.user and not self.request.user.is_staff:
            raise permissions.PermissionDenied(
                'You do not have permission to add chapters to this course'
            )
        
        # Set the order if not provided
        if 'order' not in serializer.validated_data:
            last_chapter = Chapter.objects.filter(module=module).order_by('-order').first()
            order = 1 if not last_chapter else last_chapter.order + 1
            serializer.save(order=order)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def mark_progress(self, request, pk=None):
        """
        Update progress for a chapter
        """
        chapter = self.get_object()
        course = chapter.module.course
        
        # Check if user is enrolled in the course
        try:
            enrollment = Enrollment.objects.get(user=request.user, course=course)
        except Enrollment.DoesNotExist:
            return Response(
                {'error': 'You must be enrolled in this course'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get or create progress record
        progress, created = Progress.objects.get_or_create(
            enrollment=enrollment,
            chapter=chapter
        )
        
        # Update progress status
        status_param = request.data.get('status')
        if status_param and status_param in [s[0] for s in Progress.STATUS_CHOICES]:
            old_status = progress.status
            progress.status = status_param
            
            # Update timestamps
            if status_param == 'in_progress' and old_status == 'not_started':
                progress.started_at = timezone.now()
            elif status_param == 'completed' and old_status != 'completed':
                progress.completed_at = timezone.now()
            
            # Update position for video content
            position = request.data.get('position')
            if position is not None and position.isdigit():
                progress.position = int(position)
            
            progress.save()
            
            # Update overall course progress
            total_chapters = Chapter.objects.filter(module__course=course).count()
            completed_chapters = Progress.objects.filter(
                enrollment=enrollment,
                status='completed'
            ).count()
            
            if total_chapters > 0:
                enrollment.progress = (completed_chapters / total_chapters) * 100
                if enrollment.progress >= 100 and enrollment.status == 'active':
                    enrollment.status = 'completed'
                    enrollment.completed_at = timezone.now()
                enrollment.save()
            
            return Response(ProgressSerializer(progress).data)
        
        return Response(
            {'error': 'Invalid status parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user enrollments
    """
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Regular users can only see their own enrollments
        if not (self.request.user.is_staff or self.request.user.role == 'admin'):
            return Enrollment.objects.filter(user=self.request.user)
        
        # Instructors can see enrollments for their courses
        if self.request.user.role == 'instructor':
            return Enrollment.objects.filter(course__instructor=self.request.user)
        
        # Admins can see all enrollments
        return Enrollment.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        return EnrollmentSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """
        Get progress details for an enrollment
        """
        enrollment = self.get_object()
        
        # Check permissions
        if (enrollment.user != request.user and 
            request.user.role != 'admin' and 
            not request.user.is_staff and
            enrollment.course.instructor != request.user):
            return Response(
                {'error': 'You do not have permission to view this enrollment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all progress records for this enrollment
        progress_records = Progress.objects.filter(enrollment=enrollment)
        serializer = ProgressSerializer(progress_records, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for course reviews
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        course_slug = self.request.query_params.get('course')
        if course_slug:
            return Review.objects.filter(course__slug=course_slug)
        return Review.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)