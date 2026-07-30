'use client'

import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { updateVideoProgress } from './actions';

interface YoutubePlayerClientProps {
  videoId: string;
  youtubeId: string;
  slug: string;
  initialProgress?: number;
}

export function YoutubePlayerClient({ videoId, youtubeId, slug, initialProgress = 0 }: YoutubePlayerClientProps) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const maxProgressRef = useRef<number>(initialProgress);
  const lastSyncProgressRef = useRef<number>(initialProgress);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
  };

  const onStateChange = (event: YouTubeEvent) => {
    // 1: PLAYING
    if (event.data === 1) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playerRef.current) {
      interval = setInterval(async () => {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            const percentage = (currentTime / duration) * 100;
            if (percentage > maxProgressRef.current) {
              maxProgressRef.current = percentage;
              
              // Cập nhật server nếu tăng thêm 5% hoặc vượt mốc 90%
              if (
                maxProgressRef.current - lastSyncProgressRef.current > 5 || 
                (maxProgressRef.current >= 90 && lastSyncProgressRef.current < 90)
              ) {
                lastSyncProgressRef.current = maxProgressRef.current;
                await updateVideoProgress(videoId, slug, maxProgressRef.current);
              }
            }
          }
        } catch (e) {
          console.error("Lỗi cập nhật tiến độ video:", e);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, videoId, slug]);

  return (
    <div className="w-full h-full relative aspect-video bg-black rounded-lg overflow-hidden">
      <YouTube 
        videoId={youtubeId} 
        opts={opts} 
        onReady={onReady} 
        onStateChange={onStateChange} 
        className="absolute top-0 left-0 w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
