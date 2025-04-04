import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Maximize2 } from 'lucide-react';
import { formatTimeWithMs } from '../utils/timeFormat';
import type { Caption, ExportFormat } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  selectedCaption: Caption | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onExport: (format: ExportFormat, options?: any) => void;
  onFullscreen: () => void;
  onCaptionTimeChange?: (caption: Caption, start: number, end: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  selectedCaption,
  onPlayPause,
  onSeek,
  onExport,
  onFullscreen,
  onCaptionTimeChange,
}) => {
  const handleTimeChange = (field: 'start' | 'end', value: string) => {
    if (!selectedCaption || !onCaptionTimeChange) return;
    
    // Parse minutes and seconds from the formatted time string (e.g., "01:23.456")
    const parts = value.split(':');
    if (parts.length !== 2) return;
    
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    
    if (isNaN(minutes) || isNaN(seconds)) return;
    
    const newTime = minutes * 60 + seconds;
    
    if (field === 'start') {
      if (newTime < selectedCaption.end) {
        onCaptionTimeChange(selectedCaption, newTime, selectedCaption.end);
      }
    } else {
      if (newTime > selectedCaption.start) {
        onCaptionTimeChange(selectedCaption, selectedCaption.start, newTime);
      }
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 p-3 flex items-center gap-6">
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          onClick={() => onSeek(Math.max(0, currentTime - 5))}
        >
          <SkipBack size={20} />
        </button>
        
        <button
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <button
          className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
          onClick={() => onSeek(Math.min(duration, currentTime + 5))}
        >
          <SkipForward size={20} />
        </button>
        
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-700">
          <Volume2 size={20} />
        </button>
      </div>

      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full accent-gray-700"
          step="0.001"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="font-mono text-sm text-gray-700">
          {formatTimeWithMs(currentTime)} / {formatTimeWithMs(duration)}
        </div>

        {selectedCaption && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Start:</span>
              <input
                type="text"
                value={formatTimeWithMs(selectedCaption.start)}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-28 px-2 py-1 border rounded font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">End:</span>
              <input
                type="text"
                value={formatTimeWithMs(selectedCaption.end)}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-28 px-2 py-1 border rounded font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Duration:</span>
              <input
                type="text"
                value={formatTimeWithMs(selectedCaption.end - selectedCaption.start)}
                className="w-28 px-2 py-1 border rounded font-mono text-sm bg-gray-50"
                readOnly
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-full text-gray-700"
            onClick={onFullscreen}
          >
            <Maximize2 size={20} />
          </button>
          <button
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 flex items-center gap-1"
            onClick={() => onExport('srt')}
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>
    </footer>
  );
};