import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAppSelector } from '../../app/store';
import courseImages from '../../data/courseImages';

// 임시 데이터 타입 (실제 API 구현 시 대체)
interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  lastAccessed: string;
  imageUrl: string;
  imageAlt?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 실제 구현 시 API 호출로 대체
    const fetchDashboardData = async () => {
      try {
        // 임시 데이터 (API 구현 시 대체)
        setTimeout(() => {
          setEnrolledCourses([
            {
              id: 1,
              title: '파이썬 기초 프로그래밍',
              instructor: '이강의',
              progress: 65,
              lastAccessed: '2025-05-18',
              imageUrl: courseImages.python.placeholder,
              imageAlt: courseImages.python.alt,
            },
            {
              id: 2,
              title: '데이터 분석 입문',
              instructor: '김데이터',
              progress: 30,
              lastAccessed: '2025-05-17',
              imageUrl: courseImages.dataAnalysis.placeholder,
              imageAlt: courseImages.dataAnalysis.alt,
            },
            {
              id: 3,
              title: '웹 개발 기초',
              instructor: '박웹',
              progress: 15,
              lastAccessed: '2025-05-15',
              imageUrl: courseImages.webDev.placeholder,
              imageAlt: courseImages.webDev.alt,
            },
          ]);

          setRecommendedCourses([
            {
              id: 4,
              title: '머신러닝 기초',
              instructor: '최인공',
              progress: 0,
              lastAccessed: '',
              imageUrl: courseImages.machineLearning.placeholder,
              imageAlt: courseImages.machineLearning.alt,
            },
            {
              id: 5,
              title: '고급 데이터 구조',
              instructor: '정구조',
              progress: 0,
              lastAccessed: '',
              imageUrl: courseImages.dataStructure.placeholder,
              imageAlt: courseImages.dataStructure.alt,
            },
          ]);

          setIsLoading(false);
        }, 800); // 로딩 시뮬레이션
      } catch (error) {
        console.error('Error fetching dashboard data', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 진행률 표시 컴포넌트
  const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-indigo-600 h-2.5 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  // 강의 카드 컴포넌트
  const CourseCard: React.FC<{
    course: Course;
    showProgress?: boolean;
  }> = ({ course, showProgress = false }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01]">
      <Link to={`/courses/${course.id}`}>
        <img
          src={course.imageUrl}
          alt={course.imageAlt || course.title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{course.title}</h3>
          <p className="text-gray-600 text-sm mb-2">강사: {course.instructor}</p>
          
          {showProgress && (
            <>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>진행률</span>
                <span>{course.progress}%</span>
              </div>
              <ProgressBar progress={course.progress} />
              {course.lastAccessed && (
                <p className="text-xs text-gray-500 mt-2">
                  최근 접속: {course.lastAccessed}
                </p>
              )}
            </>
          )}
          
          {!showProgress && (
            <div className="mt-2">
              <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                추천
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );

  // 로딩 상태 표시
  if (isLoading) {
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
      <div>
        {/* 환영 메시지 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">
            안녕하세요, {user?.firstName || '학습자'}님!
          </h1>
          <p>오늘도 AI-LMS에서 즐거운 학습 되세요.</p>
        </div>

        {/* 수강 중인 강의 */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">수강 중인 강의</h2>
            <Link to="/courses" className="text-indigo-600 hover:text-indigo-800">
              모두 보기
            </Link>
          </div>
          
          {enrolledCourses.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">아직 수강 중인 강의가 없습니다.</p>
              <Link
                to="/courses"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                강의 둘러보기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} showProgress={true} />
              ))}
            </div>
          )}
        </div>

        {/* 추천 강의 */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">AI 추천 강의</h2>
            <Link to="/recommendations" className="text-indigo-600 hover:text-indigo-800">
              더 많은 추천
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* 학습 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">학습 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm">이번 주 학습 시간</p>
              <p className="text-2xl font-bold">12시간 30분</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm">완료한 강의</p>
              <p className="text-2xl font-bold">7개</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600 text-sm">성취 배지</p>
              <p className="text-2xl font-bold">5개</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;