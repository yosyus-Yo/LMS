import { supabase } from '../lib/supabase';

export class SupabaseStorageService {
  private static instance: SupabaseStorageService;
  
  static getInstance(): SupabaseStorageService {
    if (!SupabaseStorageService.instance) {
      SupabaseStorageService.instance = new SupabaseStorageService();
    }
    return SupabaseStorageService.instance;
  }

  /**
   * 동영상 파일의 길이(분)를 파악하는 함수
   */
  async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationInMinutes = Math.ceil(video.duration / 60);
        resolve(durationInMinutes);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('동영상 메타데이터를 읽을 수 없습니다.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 임시 업로드된 파일들을 추적하기 위한 배열
   */
  public tempUploadedFiles: string[] = [];

  /**
   * 임시 업로드 파일을 추적에 추가
   */
  addTempUpload(filePath: string): void {
    this.tempUploadedFiles.push(filePath);
    console.log('임시 업로드 파일 추가:', filePath);
  }

  /**
   * 임시 업로드 파일을 추적에서 제거 (강의 저장 완료 시)
   */
  removeTempUpload(filePath: string): void {
    this.tempUploadedFiles = this.tempUploadedFiles.filter(f => f !== filePath);
    console.log('임시 업로드 파일 제거:', filePath);
  }

  /**
   * 모든 임시 업로드 파일들을 정리
   */
  async cleanupTempUploads(): Promise<void> {
    console.log('임시 업로드 파일 정리 시작:', this.tempUploadedFiles);
    
    const cleanupPromises = this.tempUploadedFiles.map(async (filePath) => {
      try {
        // chapter-files 버킷에서 삭제 시도
        if (filePath.includes('course-videos/')) {
          const { error } = await supabase.storage
            .from('chapter-files')
            .remove([filePath]);
          
          if (error) {
            console.error(`파일 삭제 실패 (chapter-files): ${filePath}`, error);
          } else {
            console.log(`파일 삭제 성공 (chapter-files): ${filePath}`);
          }
        }
        
        // course-thumbnails 버킷에서 삭제 시도  
        if (filePath.includes('thumbnails/')) {
          const { error } = await supabase.storage
            .from('course-thumbnails')
            .remove([filePath]);
          
          if (error) {
            console.error(`파일 삭제 실패 (course-thumbnails): ${filePath}`, error);
          } else {
            console.log(`파일 삭제 성공 (course-thumbnails): ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`파일 삭제 중 오류: ${filePath}`, error);
      }
    });

    await Promise.all(cleanupPromises);
    this.tempUploadedFiles = [];
    console.log('임시 업로드 파일 정리 완료');
  }

  /**
   * 특정 파일을 스토리지에서 삭제
   */
  async deleteFile(bucketName: string, filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (error) {
        throw new Error(`파일 삭제 실패: ${error.message}`);
      }
      
      console.log(`파일 삭제 성공: ${bucketName}/${filePath}`);
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 강의 썸네일을 Supabase Storage에 업로드
   */
  async uploadThumbnail(
    file: File,
    courseId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // 파일 검증
      this.validateImageFile(file);

      // 파일명 생성
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}_thumbnail_${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      // Storage 버킷이 존재하는지 확인하고 없으면 생성
      await this.ensureBucketExists('course-thumbnails');

      // 파일 업로드
      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // 버킷이 없다는 오류인 경우 다시 한 번 생성 시도
        if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
          console.log('썸네일 버킷을 찾을 수 없어서 재생성을 시도합니다.');
          
          // 강제로 버킷 생성
          const { error: forceCreateError } = await supabase.storage.createBucket('course-thumbnails', {
            public: true
          });
          
          if (forceCreateError) {
            console.error('강제 버킷 생성 실패:', forceCreateError);
          }
          
          // 다시 업로드 시도
          const { data: retryData, error: retryError } = await supabase.storage
            .from('course-thumbnails')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            throw new Error(`재시도 업로드 실패: ${retryError.message}`);
          }
        } else {
          throw new Error(`업로드 실패: ${error.message}`);
        }
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress(100);
      }

      // 임시 업로드 파일로 추적 (courseId가 'new'인 경우)
      if (courseId === 'new') {
        this.addTempUpload(filePath);
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('썸네일 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 동영상 파일을 Supabase Storage에 업로드
   */
  async uploadVideo(
    file: File, 
    courseId: string, 
    weekNumber: number,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // 파일 검증
      this.validateVideoFile(file);

      // 파일명 생성
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}_week${weekNumber}_${Date.now()}.${fileExt}`;
      const filePath = `course-videos/${fileName}`;

      // Storage 버킷이 존재하는지 확인하고 없으면 생성
      await this.ensureBucketExists('chapter-files');

      // 파일 업로드
      const { data, error } = await supabase.storage
        .from('chapter-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // 버킷이 없다는 오류인 경우 다시 한 번 생성 시도
        if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
          console.log('버킷을 찾을 수 없어서 재생성을 시도합니다.');
          
          // 강제로 버킷 생성
          const { error: forceCreateError } = await supabase.storage.createBucket('chapter-files', {
            public: true
          });
          
          if (forceCreateError) {
            console.error('강제 버킷 생성 실패:', forceCreateError);
          }
          
          // 다시 업로드 시도
          const { data: retryData, error: retryError } = await supabase.storage
            .from('chapter-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            throw new Error(`재시도 업로드 실패: ${retryError.message}`);
          }
        } else {
          throw new Error(`업로드 실패: ${error.message}`);
        }
      }

      // 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from('chapter-files')
        .getPublicUrl(filePath);

      if (onProgress) {
        onProgress(100);
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('동영상 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 동영상 파일 삭제
   */
  async deleteVideo(videoUrl: string): Promise<void> {
    try {
      // URL에서 파일 경로 추출
      const url = new URL(videoUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/'); // 'course-videos/filename.mp4'

      const { error } = await supabase.storage
        .from('course-videos')
        .remove([filePath]);

      if (error) {
        throw new Error(`파일 삭제 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('동영상 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 업로드 진행률 추적을 위한 업로드 (청크 단위)
   */
  async uploadVideoWithProgress(
    file: File,
    courseId: string,
    weekNumber: number,
    onProgress: (progress: number) => void
  ): Promise<{ url: string; duration: number; filePath: string }> {
    try {
      this.validateVideoFile(file);

      // 동영상 길이 파악
      let duration = 0;
      try {
        duration = await this.getVideoDuration(file);
        console.log(`동영상 길이: ${duration}분`);
      } catch (error) {
        console.warn('동영상 길이를 파악할 수 없습니다:', error);
        duration = 0;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}_week${weekNumber}_${Date.now()}.${fileExt}`;
      const filePath = `course-videos/${fileName}`;

      await this.ensureBucketExists('chapter-files');

      // 청크 단위로 업로드하여 진행률 추적
      const chunkSize = 1024 * 1024; // 1MB 청크
      const totalChunks = Math.ceil(file.size / chunkSize);
      let uploadedChunks = 0;

      // 실제로는 Supabase가 청크 업로드를 직접 지원하지 않으므로
      // 간단한 진행률 시뮬레이션 사용
      let uploadResult;
      let uploadError: any;

      try {
        // 진행률 시뮬레이션
        const progressInterval = setInterval(() => {
          uploadedChunks++;
          const progress = Math.min((uploadedChunks / totalChunks) * 100, 95);
          onProgress(progress);
          
          if (uploadedChunks >= totalChunks) {
            clearInterval(progressInterval);
          }
        }, 100);

        const { data, error } = await supabase.storage
          .from('chapter-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        clearInterval(progressInterval);
        uploadResult = data;
        uploadError = error;
      } catch (err) {
        uploadError = err;
      }

      if (uploadError) {
        // 버킷이 없다는 오류인 경우 다시 한 번 생성 시도
        const errorMessage = uploadError?.message || String(uploadError);
        if (errorMessage.includes('Bucket not found') || errorMessage.includes('not found')) {
          console.log('진행률 업로드에서 버킷을 찾을 수 없어서 재생성을 시도합니다.');
          
          // 강제로 버킷 생성
          const { error: forceCreateError } = await supabase.storage.createBucket('chapter-files', {
            public: true
          });
          
          if (forceCreateError) {
            console.error('강제 버킷 생성 실패:', forceCreateError);
          }
          
          // 다시 업로드 시도
          const { data: retryData, error: retryError } = await supabase.storage
            .from('chapter-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            throw new Error(`재시도 업로드 실패: ${retryError.message || retryError}`);
          }
          
          uploadResult = retryData;
        } else {
          throw new Error(`업로드 실패: ${uploadError?.message || uploadError}`);
        }
      }

      onProgress(100);

      const { data: urlData } = supabase.storage
        .from('chapter-files')
        .getPublicUrl(filePath);

      // 임시 업로드 파일로 추적 (courseId가 'new'인 경우)
      if (courseId === 'new') {
        this.addTempUpload(filePath);
      }

      return {
        url: urlData.publicUrl,
        duration: duration,
        filePath: filePath // 나중에 정리할 수 있도록 경로도 반환
      };
    } catch (error) {
      console.error('동영상 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 동영상 파일 크기 및 형식 검증
   */
  private validateVideoFile(file: File): void {
    // 파일 크기 제한 (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('파일 크기는 500MB를 초과할 수 없습니다.');
    }

    // 지원되는 동영상 형식
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 파일 형식입니다. MP4, WebM, OGG, AVI, MOV, WMV 파일만 업로드 가능합니다.');
    }
  }

  /**
   * 이미지 파일 크기 및 형식 검증
   */
  private validateImageFile(file: File): void {
    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('이미지 파일 크기는 10MB를 초과할 수 없습니다.');
    }

    // 지원되는 이미지 형식
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF 파일만 업로드 가능합니다.');
    }
  }

  /**
   * Storage 버킷 존재 확인 및 생성
   */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      // 먼저 버킷에 접근을 시도해서 존재하는지 확인
      const { data: testData, error: testError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      // 버킷이 존재하면 바로 리턴
      if (!testError) {
        console.log(`버킷 '${bucketName}'가 이미 존재합니다.`);
        return;
      }

      // 버킷이 없으면 생성 시도
      if (testError && testError.message.includes('not found')) {
        console.log(`버킷 '${bucketName}'가 없어서 생성을 시도합니다.`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['video/*'],
          fileSizeLimit: 500 * 1024 * 1024 // 500MB
        });
        
        if (createError) {
          console.error('버킷 생성 실패:', createError);
          throw new Error(`버킷 생성 실패: ${createError.message}`);
        }
        
        console.log(`버킷 '${bucketName}'가 성공적으로 생성되었습니다.`);
      } else {
        // 다른 종류의 오류
        console.error('버킷 접근 오류:', testError);
        throw new Error(`버킷 접근 실패: ${testError.message}`);
      }
    } catch (error) {
      console.error('버킷 확인/생성 중 오류:', error);
      // 버킷 생성에 실패해도 업로드를 시도해보도록 오류를 던지지 않음
    }
  }

  /**
   * 동영상 스트리밍 URL 생성
   */
  getStreamingUrl(videoUrl: string): string {
    // Supabase Storage에서 제공하는 URL은 이미 스트리밍 가능
    return videoUrl;
  }

  /**
   * 동영상 썸네일 생성 (미래 구현을 위한 플레이스홀더)
   */
  async generateThumbnail(videoUrl: string): Promise<string | null> {
    // 추후 구현: 동영상에서 썸네일 추출
    // 현재는 null 반환
    return null;
  }

  /**
   * 업로드된 파일 정보 조회
   */
  async getFileInfo(videoUrl: string): Promise<any> {
    try {
      const url = new URL(videoUrl);
      const pathSegments = url.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/');

      const { data, error } = await supabase.storage
        .from('course-videos')
        .list(pathSegments[pathSegments.length - 2]);

      if (error) {
        throw error;
      }

      const fileName = pathSegments[pathSegments.length - 1];
      const fileInfo = data.find(file => file.name === fileName);

      return fileInfo;
    } catch (error) {
      console.error('파일 정보 조회 실패:', error);
      return null;
    }
  }
}

export const storageService = SupabaseStorageService.getInstance();