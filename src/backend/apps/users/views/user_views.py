"""
Views for the users app.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.users.models import User, UserProfile
from apps.users.serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserUpdateSerializer,
    UserProfileUpdateSerializer,
    PasswordChangeSerializer
)
from apps.users.permissions import IsAdminOrSelf

# IsAdminUser는 rest_framework에서 가져오기
from rest_framework.permissions import IsAdminUser


class UserListView(generics.ListAPIView):
    """View to list all users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserDetailView(generics.RetrieveAPIView):
    """View to retrieve a user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrSelf]


class UserUpdateView(generics.UpdateAPIView):
    """View to update a user."""
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAdminOrSelf]


class UserDeleteView(generics.DestroyAPIView):
    """View to delete a user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserRegistrationView(generics.CreateAPIView):
    """View to register a new user."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(APIView):
    """View to retrieve the current authenticated user."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserProfileDetailView(generics.RetrieveAPIView):
    """View to retrieve a user profile."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminOrSelf]


class UserProfileUpdateView(generics.UpdateAPIView):
    """View to update a user profile."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [IsAdminOrSelf]


class PasswordChangeView(APIView):
    """View to change a user's password."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            # Check old password
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response(
                {"success": "Password has been changed successfully."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)