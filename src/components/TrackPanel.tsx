import React from 'react';
import { TimeColumn } from './TimeColumn';
import { CaptionTrack } from './CaptionTrack';
import { FileText, Plus } from 'lucide-react';
import type { Track, Caption } from '../types';
import { PX_PER_SECOND } from '../utils/constants';

interface TrackPanelProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  selectedCaption: Caption | null;
  selectedCaptions: Caption[];
  onCaptionSelect: (caption: Caption) => void;
  onCaptionMultiSelect: (caption: Caption, append: boolean) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onTimeChange: (caption: Caption, start: number, end: number) => void;
  onToggleTrackVisibility: (trackId: number) => void;
  onMoveTrack: (trackId: number, direction: 'up' | 'down') => void;
  onRemoveTrack: (trackId: number) => void;
  onCreateBlankTrack: () => void;
  onCaptionUpload: (file: File, trackId: number) => void;
  trackBodyRef: React.RefObject<HTMLDivElement>;
  onCaptionTextChange?: (caption: Caption, text: string) => void;
  onFontStyleChange?: (trackId: number, fontStyle: { fontFamily: string; fontSize: number }) => void;
  onSplitCaption?: (caption: Caption, parts: 2 | 3 | 4) => void;
  onMergeCaptions?: (captions: Caption[]) => void;
  onDeleteCaptions?: () => void;
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  tracks,
  currentTime,
  duration,
  selectedCaption,
  selectedCaptions,
  onCaptionSelect,
  onCaptionMultiSelect,
  onEditStart,
  onEditEnd,
  onTimeChange,
  onToggleTrackVisibility,
  onMoveTrack,
  onRemoveTrack,
  onCreateBlankTrack,
  onCaptionUpload,
  trackBodyRef,
  onCaptionTextChange,
  onFontStyleChange,
  onSplitCaption,
  onMergeCaptions,
  onDeleteCaptions,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-6">
          <div className="text-center">
            <p className="text-lg mb-2">No caption tracks loaded</p>
            <p className="text-sm">Upload captions or create a blank track to get started</p>
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-800">
              <FileText size={18} />
              <span>Upload SRT File</span>
              <input
                type="file"
                accept=".srt,.vtt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onCaptionUpload(file, Date.now());
                }}
              />
            </label>
            
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={onCreateBlankTrack}
            >
              <Plus size={18} />
              <span>Create Blank Track</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // The header has a height of 10px in the components
  const headerHeight = 10;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f5f5e6]" ref={trackBodyRef}>
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex min-h-full relative">
          <TimeColumn duration={duration} />
          <div className="flex-1 flex border-l border-gray-700">
            {tracks.map((track, index) => (
              <CaptionTrack
                key={track.id}
                track={track}
                currentTime={currentTime}
                selectedCaption={selectedCaption}
                selectedCaptions={selectedCaptions}
                onCaptionSelect={onCaptionSelect}
                onCaptionMultiSelect={onCaptionMultiSelect}
                duration={duration}
                onEditStart={onEditStart}
                onEditEnd={onEditEnd}
                onTimeChange={onTimeChange}
                onToggleVisibility={onToggleTrackVisibility}
                onMoveTrack={onMoveTrack}
                onRemoveTrack={onRemoveTrack}
                canMoveUp={index > 0}
                canMoveDown={index < tracks.length - 1}
                onCaptionTextChange={onCaptionTextChange}
                onFontStyleChange={onFontStyleChange}
                onSplitCaption={onSplitCaption}
                onMergeCaptions={onMergeCaptions}
                onDeleteCaptions={onDeleteCaptions}
              />
            ))}
          </div>
          
          {/* 
            Playhead line that extends across the entire panel.
            Position it at the header height (10px) plus the time-based offset,
            with a slight negative top margin to align perfectly with the header border.
          */}
          <div
  className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
  style={{ 
    top: `${currentTime * PX_PER_SECOND + 40}px`,
    marginTop: '-0.5px'
  }}
/>
        </div>
      </div>
    </div>
  );
};