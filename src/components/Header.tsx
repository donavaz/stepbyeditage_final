import React, { useState } from 'react';
import { Upload, Settings, FileText, Languages, Mic, Plus, Scissors, Combine, Trash2, Undo } from 'lucide-react';

interface HeaderProps {
  onVideoUpload: (file: File) => void;
  onCaptionUpload: (file: File, track: number) => void;
  onCreateBlankTrack: () => void;
  onAutoTranscribe: () => void;
  onAutoTranslate: () => void;
  onSettingsClick: () => void;
  onSplitCaption?: (parts: 2 | 3 | 4) => void;
  onMergeCaptions?: () => void;
  onDeleteCaptions?: () => void;
  onUndo?: () => void;
  isAutoTranscribeEnabled?: boolean;
  canSplit?: boolean;
  canMerge?: boolean;
  canDelete?: boolean;
  canUndo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onVideoUpload,
  onCaptionUpload,
  onCreateBlankTrack,
  onAutoTranscribe,
  onAutoTranslate,
  onSettingsClick,
  onSplitCaption,
  onMergeCaptions,
  onDeleteCaptions,
  onUndo,
  isAutoTranscribeEnabled = false,
  canSplit = false,
  canMerge = false,
  canDelete = false,
  canUndo = false,
}) => {
  const [showCaptionOptions, setShowCaptionOptions] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  return (
    <header className="bg-[#357CA5] text-white px-4 py-2 flex justify-between items-center">
      <div className="flex gap-4">
        <div className="relative group">
          <button className="px-3 py-1 hover:bg-[#1D4ED8] rounded">File</button>
          <div className="absolute hidden group-hover:block w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Upload Video
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Upload Source Captions
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Upload Translated Captions
            </button>
            <hr className="my-1" />
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Export as SRT
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Export as VTT
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Export as CSV
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm">
              Export as TXT
            </button>
          </div>
        </div>
        
        <div className="relative">
          <button 
            className="px-3 py-1 hover:bg-[#1D4ED8] rounded"
            onClick={() => setShowEditMenu(!showEditMenu)}
          >
            Edit
          </button>
          {showEditMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canUndo ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canUndo && onUndo && onUndo()}
                disabled={!canUndo}
              >
                <div className="flex items-center">
                  <Undo size={14} className="mr-2" />
                  <span>Undo</span>
                </div>
                <span className="text-xs text-gray-400">Ctrl+Z</span>
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canDelete ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canDelete && onDeleteCaptions && onDeleteCaptions()}
                disabled={!canDelete}
              >
                <div className="flex items-center">
                  <Trash2 size={14} className="mr-2" />
                  <span>Delete Caption</span>
                </div>
                <span className="text-xs text-gray-400">Delete</span>
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                Split Caption Into...
              </div>
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canSplit ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canSplit && onSplitCaption && onSplitCaption(2)}
                disabled={!canSplit}
              >
                <div className="flex items-center">
                  <Scissors size={14} className="mr-2" />
                  <span>2 Captions</span>
                </div>
                <span className="text-xs text-gray-400">Ctrl+2</span>
              </button>
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canSplit ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canSplit && onSplitCaption && onSplitCaption(3)}
                disabled={!canSplit}
              >
                <div className="flex items-center">
                  <Scissors size={14} className="mr-2" />
                  <span>3 Captions</span>
                </div>
                <span className="text-xs text-gray-400">Ctrl+3</span>
              </button>
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canSplit ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canSplit && onSplitCaption && onSplitCaption(4)}
                disabled={!canSplit}
              >
                <div className="flex items-center">
                  <Scissors size={14} className="mr-2" />
                  <span>4 Captions</span>
                </div>
                <span className="text-xs text-gray-400">Ctrl+4</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button 
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${canMerge ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={() => canMerge && onMergeCaptions && onMergeCaptions()}
                disabled={!canMerge}
              >
                <div className="flex items-center">
                  <Combine size={14} className="mr-2" />
                  <span>Merge Captions</span>
                </div>
                <span className="text-xs text-gray-400">Ctrl+M</span>
              </button>
            </div>
          )}
        </div>
        
        <button className="px-3 py-1 hover:bg-[#1D4ED8] rounded">Track</button>
        <button className="px-3 py-1 hover:bg-[#1D4ED8] rounded">View</button>
      </div>
      
      <div className="flex gap-3">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-[#1D4ED8] rounded cursor-pointer hover:bg-[#1D4ED8]">
          <Upload size={16} />
          <span>Upload Video</span>
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
        
        <div className="relative">
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1D4ED8] rounded hover:bg-[#1D4ED8]"
            onClick={() => setShowCaptionOptions(!showCaptionOptions)}
          >
            <FileText size={16} />
            <span>Caption Track</span>
          </button>
          
          {showCaptionOptions && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
              <label className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2 cursor-pointer">
                <Upload size={16} className="text-gray-600" />
                <span>Import SRT File</span>
                <input
                  type="file"
                  accept=".srt,.vtt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onCaptionUpload(file, Date.now());
                      setShowCaptionOptions(false);
                    }
                  }}
                />
              </label>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2"
                onClick={() => {
                  onCreateBlankTrack();
                  setShowCaptionOptions(false);
                }}
              >
                <Plus size={16} className="text-gray-600" />
                <span>Create Blank Track</span>
              
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={onAutoTranscribe}
          className={`flex items-center gap-2 px-3 py-1.5 rounded ${
            isAutoTranscribeEnabled ? 'bg-[#1D4ED8] hover:bg-[#1D4ED8]' : 'bg-gray-500 cursor-not-allowed'
          }`}
          disabled={!isAutoTranscribeEnabled}
          title={!isAutoTranscribeEnabled ? "Auto-transcribe is only available when no tracks exist" : ""}
        >
          <Mic size={16} />
          <span>Auto-Transcribe</span>
        </button>

        <button 
          onClick={onAutoTranslate}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1D4ED8] rounded hover:bg-[#1D4ED8]"
        >
          <Languages size={16} />
          <span>Auto-Translate</span>
        </button>

        <button 
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1D4ED8] rounded hover:bg-[#1D4ED8]"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};