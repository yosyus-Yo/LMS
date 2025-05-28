import React, { useState } from 'react';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  url: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
  playing?: boolean;
  muted?: boolean;
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  width = '100%',
  height = '400px',
  controls = true,
  playing = false,
  muted = false,
  onProgress,
  onDuration,
  onEnded
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReady = () => {
    setIsReady(true);
    setError(null);
  };

  const handleError = (error: any) => {
    console.error('비디오 재생 오류:', error);
    setError('비디오를 재생할 수 없습니다.');
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ width, height }}>
        <p className="text-gray-500">비디오가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-900 text-white px-4 py-2">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
      
      <div className="relative">
        {!isReady && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white z-10"
            style={{ width, height }}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>비디오 로딩 중...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 z-10"
            style={{ width, height }}
          >
            <p>{error}</p>
          </div>
        )}
        
        <ReactPlayer
          url={url}
          width={width}
          height={height}
          controls={controls}
          playing={playing}
          muted={muted}
          onReady={handleReady}
          onError={handleError}
          onProgress={onProgress}
          onDuration={onDuration}
          onEnded={onEnded}
          config={{
            file: {
              attributes: {
                crossOrigin: 'anonymous',
                controlsList: 'nodownload'
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;