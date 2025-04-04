import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ChevronUp, ChevronDown, X, Type } from 'lucide-react';
import type { Caption, Track } from '../types';
import { formatTimeWithMs } from '../utils/timeFormat';
import { PX_PER_SECOND } from '../utils/constants';
import { FontSelector } from './FontSelector';
import { CaptionContextMenu } from './CaptionContextMenu';

interface CaptionTrackProps {
  track: Track;
  currentTime: number;
  selectedCaption: Caption | null;
  selectedCaptions: Caption[];
  onCaptionSelect: (caption: Caption) => void;
  onCaptionMultiSelect: (caption: Caption, append: boolean) => void;
  duration: number;
  onEditStart: () => void;
  onEditEnd: () => void;
  onTimeChange: (caption: Caption, start: number, end: number) => void;
  onToggleVisibility: (trackId: number) => void;
  onMoveTrack: (trackId: number, direction: 'up' | 'down') => void;
  onRemoveTrack: (trackId: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onCaptionTextChange?: (caption: Caption, text: string) => void;
  onFontStyleChange?: (trackId: number, fontStyle: { fontFamily: string; fontSize: number }) => void;
  onSplitCaption?: (caption: Caption, parts: 2 | 3 | 4) => void;
  onMergeCaptions?: (captions: Caption[]) => void;
  onDeleteCaptions?: () => void;
}

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  track,
  currentTime,
  selectedCaption,
  selectedCaptions,
  onCaptionSelect,
  onCaptionMultiSelect,
  duration,
  onEditStart,
  onEditEnd,
  onTimeChange,
  onToggleVisibility,
  onMoveTrack,
  onRemoveTrack,
  canMoveUp,
  canMoveDown,
  onCaptionTextChange,
  onFontStyleChange,
  onSplitCaption,
  onMergeCaptions,
  onDeleteCaptions,
}) => {
  const totalSeconds = Math.ceil(duration || 0);
  const editableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    caption: Caption;
  } | null>(null);
  
  // Default colors for all tracks
  const trackBgColor = '#f8f9fa';
  const headerBgColor = '#333333';
  const captionActiveColor = 'bg-blue-600';
  const captionNumBg = 'bg-blue-600';
  
  // Default font settings if not provided
  const fontStyle = track.fontStyle || { fontFamily: 'Arial', fontSize: 14 };

  useEffect(() => {
    if (editableRef.current && selectedCaption) {
      editableRef.current.innerText = selectedCaption.text;
    }
  }, [selectedCaption]);
  
  const handleResizeStart = (e: React.MouseEvent, caption: Caption, isTop: boolean) => {
    e.stopPropagation();
    const startY = e.clientY;
    const originalStart = caption.start;
    const originalEnd = caption.end;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const timeDelta = deltaY / PX_PER_SECOND;

      let newStart = originalStart;
      let newEnd = originalEnd;

      if (isTop) {
        newStart = Math.max(0, originalStart + timeDelta);
        if (newStart < caption.end - 0.1) {
          onTimeChange(caption, newStart, newEnd);
        }
      } else {
        newEnd = Math.min(duration, Math.max(caption.start + 0.1, originalEnd + timeDelta));
        onTimeChange(caption, newStart, newEnd);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e: React.MouseEvent, caption: Caption) => {
    // Prevent dragging when clicking on resize handles or editable text
    if ((e.target as HTMLElement).contentEditable === 'true' || 
        (e.target as HTMLElement).classList.contains('cursor-ns-resize')) {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    const startY = e.clientY;
    const captionDuration = caption.end - caption.start;
    const originalStart = caption.start;
    
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const timeDelta = deltaY / PX_PER_SECOND;
      
      // Calculate new start time, ensuring it doesn't go below 0
      const newStart = Math.max(0, originalStart + timeDelta);
      
      // Ensure the caption doesn't extend beyond the duration
      if (newStart + captionDuration <= duration) {
        onTimeChange(caption, newStart, newStart + captionDuration);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'grabbing';
  };

  const handleTextChange = (caption: Caption, element: HTMLDivElement) => {
    const newText = element.innerText || '';
    if (onCaptionTextChange) {
      onCaptionTextChange(caption, newText);
    }
  };

  const handleFontStyleChange = (newFontStyle: { fontFamily: string; fontSize: number }) => {
    if (onFontStyleChange) {
      onFontStyleChange(track.id, newFontStyle);
    }
  };

  // Handle keyboard events in editable caption
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow Enter key to create a line break
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't need to prevent default as we want normal line break behavior
      // Just ensure the current caption is updated
      if (editableRef.current && onCaptionTextChange && selectedCaption) {
        // This will be handled by the onInput event
      }
    }
  };

  // Handle paste to preserve line breaks but strip formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Prevent the default paste
    e.preventDefault();
    
    // Get text from clipboard
    const text = e.clipboardData.getData('text/plain');
    
    // Insert text at cursor position
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor to the end
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Handle right-click for context menu
  const handleRightClick = (e: React.MouseEvent, caption: Caption) => {
    e.preventDefault();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
      caption
    });
  };

  // Handle caption click with multi-select
  const handleCaptionClick = (e: React.MouseEvent, caption: Caption) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    onCaptionMultiSelect(caption, isCtrlPressed);
  };

  return (
    <div className="flex-1 relative min-h-full border-r border-gray-700" style={{ backgroundColor: trackBgColor }}>
      {/* Track Header */}
      <div 
        className="h-10 flex items-center px-4 justify-between sticky top-0 z-10 shadow-sm border-b border-gray-700 text-white" 
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {/* Flag icon based on language */}
            {track.language === 'en' && <span className="mr-1">🇺🇸</span>}
            {track.language === 'ja' && <span className="mr-1">🇯🇵</span>}
            {track.name}
          </span>
          <span className="px-2 py-0.5 bg-blue-700 text-white rounded-full text-xs font-medium">
            {track.language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Font style button */}
          <FontSelector 
            value={fontStyle}
            onChange={handleFontStyleChange}
          />
          
          <button 
            className={`p-1 rounded hover:bg-gray-700 ${!canMoveUp ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => canMoveUp && onMoveTrack(track.id, 'up')}
            disabled={!canMoveUp}
            title="Move Up"
          >
            <ChevronUp size={16} />
          </button>
          <button 
            className={`p-1 rounded hover:bg-gray-700 ${!canMoveDown ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={() => canMoveDown && onMoveTrack(track.id, 'down')}
            disabled={!canMoveDown}
            title="Move Down"
          >
            <ChevronDown size={16} />
          </button>
          <button 
            className="p-1 rounded hover:bg-gray-700"
            onClick={() => onToggleVisibility(track.id)}
            title={track.visible ? "Hide Captions" : "Show Captions"}
          >
            {track.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button 
            className="p-1 rounded hover:bg-red-600"
            onClick={() => onRemoveTrack(track.id)}
            title="Remove Track"
          >
            <X size={16} />
          </button>
          <span className="text-xs bg-blue-700 px-2 rounded-full">{track.captions.length}</span>
        </div>
      </div>

      {/* Caption Blocks */}
      <div 
        className="absolute inset-0 top-10" 
        style={{ height: `${Math.max(totalSeconds * PX_PER_SECOND, 600)}px` }}
      >
        {/* Grid Lines are now handled by TimeColumn component */}

        {/* Captions */}
        {track.captions.map((caption, index) => {
          const isActive = currentTime >= caption.start && currentTime <= caption.end;
          const isSelected = selectedCaption?.id === caption.id || selectedCaptions.some(c => c.id === caption.id);
          
          // Determine caption appearance based on state
          const captionBgColor = isActive || isSelected ? captionActiveColor : 'bg-white';
          const captionTextColor = isActive || isSelected ? 'text-white' : 'text-gray-700';
          const captionBorderColor = isActive || isSelected ? 'border-blue-700' : 'border-gray-200';

          return (
            <div
              key={caption.id}
              className={`absolute left-2 right-2 ${captionBgColor} border ${captionBorderColor} rounded-md transition-all shadow-sm ${
                isActive || isSelected ? 'shadow-md' : 'hover:shadow-sm'
              } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                top: `${caption.start * PX_PER_SECOND}px`,
                height: `${Math.max((caption.end - caption.start) * PX_PER_SECOND, 30)}px`,
              }}
              onClick={(e) => handleCaptionClick(e, caption)}
              onMouseDown={(e) => handleDragStart(e, caption)}
              onContextMenu={(e) => handleRightClick(e, caption)}
              data-caption-id={caption.id}
            >
              {/* Resize Handles */}
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-yellow-400 rounded-t-md"
                onMouseDown={(e) => handleResizeStart(e, caption, true)}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-yellow-400 rounded-b-md"
                onMouseDown={(e) => handleResizeStart(e, caption, false)}
              />

              <div className="flex h-full">
                <div className={`w-8 flex items-center justify-center text-sm font-bold text-white rounded-l-md ${captionNumBg}`}>
                  #{index + 1}
                </div>
                <div 
                  ref={isSelected && selectedCaptions.length <= 1 ? editableRef : null}
                  className={`flex-1 p-2 text-sm ${captionTextColor} cursor-text overflow-auto`}
                  contentEditable
                  suppressContentEditableWarning
                  onFocus={onEditStart}
                  onBlur={(e) => {
                    onEditEnd();
                    handleTextChange(caption, e.currentTarget);
                  }}
                  onInput={(e) => handleTextChange(caption, e.currentTarget)}
                  onKeyDown={handleKeyDown}
                  style={{
                    fontFamily: fontStyle.fontFamily,
                    fontSize: `${fontStyle.fontSize}px`,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4'
                  }}
                  onPaste={handlePaste}
                  dangerouslySetInnerHTML={{ __html: caption.text.replace(/\n/g, '<br>') }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <CaptionContextMenu
          position={contextMenu.position}
          caption={contextMenu.caption}
          onClose={() => setContextMenu(null)}
          onSplitInto={(parts) => {
            if (onSplitCaption) {
              onSplitCaption(contextMenu.caption, parts);
              setContextMenu(null);
            }
          }}
          onMerge={() => {
            if (onMergeCaptions && selectedCaptions.length > 1) {
              onMergeCaptions(selectedCaptions);
              setContextMenu(null);
            }
          }}
          onDelete={() => {
            if (onDeleteCaptions) {
              onDeleteCaptions();
              setContextMenu(null);
            }
          }}
          canMerge={selectedCaptions.length > 1}
          canDelete={selectedCaptions.length > 0}
        />
      )}
    </div>
  );
};