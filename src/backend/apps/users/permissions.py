from rest_framework import permissions


class IsAdminOrSelf(permissions.BasePermission):
    """
    Allow users to view/edit their own resources.
    Allow admins to view/edit all resources.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow if user is admin
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Allow if user is the owner of the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Allow if object is the user
        return obj == request.user


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Allow read-only access to all users.
    Allow write access to instructors and admins.
    """
    
    def has_permission(self, request, view):
        # Allow read-only access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Allow write access to instructors and admins
        return request.user and request.user.is_authenticated and (
            request.user.role in ['instructor', 'admin'] or request.user.is_staff
        )
    
    def has_object_permission(self, request, view, obj):
        # Allow read-only access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Allow write access if user is admin
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Allow write access if user is the instructor who created the course
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user
        
        return False


class IsEnrolledOrInstructor(permissions.BasePermission):
    """
    Allow access to course content if:
    - User is the instructor of the course
    - User is enrolled in the course
    - User is an admin
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow if user is admin
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Get course object depending on the view
        if hasattr(obj, 'course'):
            course = obj.course
        elif hasattr(obj, 'module') and hasattr(obj.module, 'course'):
            course = obj.module.course
        else:
            course = obj
        
        # Allow if user is the instructor of the course
        if course.instructor == request.user:
            return True
        
        # Allow if user is enrolled in the course
        if hasattr(course, 'enrollments'):
            return course.enrollments.filter(user=request.user).exists()
        
        return False