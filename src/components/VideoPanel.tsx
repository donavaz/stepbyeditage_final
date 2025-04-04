import React, { useState } from 'react';
import type { Caption } from '../types';
import { Upload, X } from 'lucide-react';

interface VideoPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string | null;
  videoName?: string | null;
  captions: Caption[];
  currentTime: number;
  visibleTracks: number[];
  onVideoUpload: (file: File) => void;
  onCloseProject?: () => void;
  isFullscreen?: boolean;
  activeCaptions?: Caption[];
}

export const VideoPanel: React.FC<VideoPanelProps> = ({
  videoRef,
  videoUrl,
  videoName,
  captions,
  currentTime,
  visibleTracks,
  onVideoUpload,
  onCloseProject,
  isFullscreen = false,
  activeCaptions = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Only show captions from visible tracks
  const visibleCaptions = activeCaptions.length > 0 
    ? activeCaptions 
    : captions
        .filter(cap => visibleTracks.includes(cap.track))
        .filter(cap => currentTime >= cap.start && currentTime <= cap.end);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onVideoUpload(file);
      }
    }
  };

  // Display name to show in the video tab
  const displayName = videoName || (videoUrl ? "Video File" : "No video loaded");

  return (
    <div className="flex flex-col h-full">
      {/* Video Panel Header */}
      <div className="h-10 bg-[white] border-b border-r border-gray-700 flex items-center justify-between px-2 sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            className="p-1 text-white-400 hover:text-white hover:bg-gray-700 rounded mr-2"
            onClick={onCloseProject}
            title="Close Project"
          >
            <X size={18} />
          </button>
          
          <div className="px-3 py-1 bg-gray-700 text-white rounded-t border-b-2 border-blue-500 text-sm max-w-xs truncate">
            {displayName}
          </div>
        </div>
              
      </div>
      
      <div 
        className="relative flex-1"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`h-full bg-white-900 relative ${isDragging ? 'border-2 border-dashed border-blue-400' : ''}`}>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              controls={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-300">
              <Upload size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Drop video here or use the upload button</p>
              <p className="text-sm mt-2 text-gray-400">Supports MP4, WebM, and other browser-compatible formats</p>
              <div className="mt-4">
                <label className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 cursor-pointer">
                  Upload Video
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onVideoUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          )}
          
          <div className={`absolute ${isFullscreen ? 'bottom-16' : 'bottom-8'} left-0 right-0 flex flex-col items-center gap-2`}>
            {visibleCaptions.map((caption) => (
              <div 
                key={caption.id} 
                className="bg-black bg-opacity-75 text-white px-4 py-2 rounded text-lg max-w-[80%] whitespace-pre-line"
                style={{ textAlign: 'center', display: 'block', lineHeight: '1.5' }}
              >
                {caption.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};