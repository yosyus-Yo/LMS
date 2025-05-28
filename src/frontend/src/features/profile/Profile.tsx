import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { getUserProfile } from '../auth/authSlice';
import Layout from '../../components/common/Layout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiClient from '../../api/apiClient';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'instructor' | 'student';
  profile?: {
    id: string;
    phone_number?: string;
    address?: string;
    organization?: string;
    job_title?: string;
    bio?: string;
    skills: string[];
    preferences: Record<string, any>;
    profile_image_url?: string;
    created_at: string;
    updated_at: string;
  };
}

const Profile: React.FC = () => {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    phone_number: '',
    address: '',
    organization: '',
    job_title: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // 현재 인증된 사용자 정보를 Redux에서 가져오기
      if (user) {
        console.log('사용자 정보:', user);
        setProfileData(user);
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          bio: '',
          phone_number: '',
          address: '',
          organization: '',
          job_title: '',
        });
      } else {
        // Redux에 사용자 정보가 없으면 API에서 가져오기
        const response = await apiClient.auth.getCurrentUser();
        if (response.data) {
          setProfileData(response.data);
          setFormData({
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            bio: response.data.bio || '',
            phone_number: response.data.phone_number || '',
            address: response.data.address || '',
            organization: response.data.organization || '',
            job_title: response.data.job_title || '',
          });
        }
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage('');

      // Supabase API로 프로필 업데이트
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('사용자 인증이 필요합니다.');
      }

      // 사용자 프로필 업데이트
      const profileUpdateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        phone_number: formData.phone_number,
        address: formData.address,
        organization: formData.organization,
        job_title: formData.job_title,
        updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update(profileUpdateData)
        .eq('id', currentUser.id);

      if (error) {
        throw new Error(error.message || '프로필 업데이트에 실패했습니다.');
      }

      setMessage('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
      fetchProfile(); // 최신 데이터 다시 가져오기
      dispatch(getUserProfile()); // Redux 상태도 업데이트
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      setMessage('프로필 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'instructor': return '강사';
      case 'student': return '학생';
      default: return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (isLoading || !profileData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
              {!isEditing ? (
                <Button
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                >
                  프로필 편집
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setMessage('');
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    저장
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 메시지 */}
          {message && (
            <div className={`mx-6 mt-4 p-3 rounded ${
              message.includes('성공') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 프로필 이미지 및 기본 정보 */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-gray-300 rounded-full flex items-center justify-center mb-4">
                    {false ? (
                      <img
                        src=""
                        alt="프로필"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profileData.first_name} {profileData.last_name}
                  </h2>
                  <p className="text-gray-600">{profileData.email}</p>
                  <span className="inline-block px-2 py-1 mt-2 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {getRoleName(profileData.role)}
                  </span>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">계정 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">가입일:</span>
                      <span className="ml-2">{formatDate(profileData.profile?.created_at || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="first_name"
                        name="first_name"
                        label="이름"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                      <Input
                        id="last_name"
                        name="last_name"
                        label="성"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                    </div>
                    <div className="mt-4">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        자기소개
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                          !isEditing ? 'bg-gray-50' : ''
                        }`}
                        placeholder="자기소개를 입력하세요"
                      />
                    </div>
                  </div>

                  {/* 연락처 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">연락처 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="phone_number"
                        name="phone_number"
                        label="전화번호"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                      <Input
                        id="address"
                        name="address"
                        label="주소"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* 직업 정보 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">직업 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="organization"
                        name="organization"
                        label="소속 기관"
                        value={formData.organization}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                      <Input
                        id="job_title"
                        name="job_title"
                        label="직책"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;