import React, { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  onProgress,
  onComplete,
  initialProgress = 0,
  autoPlay = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 초기 진도 설정
    if (initialProgress > 0) {
      video.currentTime = (initialProgress / 100) * video.duration;
    }

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      
      setCurrentTime(current);
      
      if (total > 0) {
        const progress = (current / total) * 100;
        onProgress?.(progress);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (initialProgress > 0 && video.duration > 0) {
        video.currentTime = (initialProgress / 100) * video.duration;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      console.error('❌ 비디오 재생 오류:', e);
      const error = (e.target as HTMLVideoElement).error;
      let message = '비디오를 재생할 수 없습니다.';
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = '비디오 로딩이 중단되었습니다.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = '네트워크 오류로 비디오를 로드할 수 없습니다.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = '비디오 디코딩 오류가 발생했습니다.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = '지원되지 않는 비디오 형식입니다.';
            break;
          default:
            message = '알 수 없는 비디오 오류가 발생했습니다.';
        }
      }
      
      setHasError(true);
      setErrorMessage(message);
      console.log('🔗 비디오 URL:', src);
    };

    const handleCanPlay = () => {
      setHasError(false);
      setErrorMessage('');
      console.log('✅ 비디오 재생 준비 완료');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, initialProgress, onProgress, onComplete]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'ArrowLeft':
        skipTime(-10);
        break;
      case 'ArrowRight':
        skipTime(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.1));
        break;
    }
  };

  let hideControlsTimer: NodeJS.Timeout;

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'w-full h-full' : 'w-full aspect-video'}`}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        autoPlay={autoPlay}
        playsInline
        onClick={togglePlay}
        crossOrigin="anonymous"
      />

      {/* 에러 표시 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80">
          <div className="text-center text-white p-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-lg font-semibold mb-2">비디오 재생 오류</h3>
            <p className="text-sm mb-4">{errorMessage}</p>
            <p className="text-xs text-gray-300 break-all">URL: {src}</p>
            <button 
              onClick={() => {
                setHasError(false);
                const video = videoRef.current;
                if (video) {
                  video.load();
                }
              }}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 로딩 표시 */}
      {!duration && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>비디오 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 컨트롤 바 */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* 진행 바 */}
        <div className="mb-4">
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            {/* 버퍼된 부분 */}
            <div 
              className="absolute top-0 left-0 h-full bg-gray-400 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* 재생된 부분 */}
            <div 
              className="absolute top-0 left-0 h-full bg-red-500 rounded-full"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* 재생 위치 표시 */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* 10초 뒤로 */}
            <button
              onClick={() => skipTime(-10)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="10초 뒤로"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
            </button>

            {/* 10초 앞으로 */}
            <button
              onClick={() => skipTime(10)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="10초 앞으로"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.383l4-2.793z" clipRule="evenodd" />
                <path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-full"
              />
            </div>

            {/* 시간 표시 */}
            <span className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* 전체화면 버튼 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="전체화면"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 키보드 단축키 도움말 */}
      <div className="absolute top-4 right-4 text-white text-xs opacity-50">
        <div>Space/K: 재생/일시정지</div>
        <div>←/→: 10초 이동</div>
        <div>↑/↓: 볼륨 조절</div>
        <div>F: 전체화면</div>
      </div>
    </div>
  );
};

export default VideoPlayer;