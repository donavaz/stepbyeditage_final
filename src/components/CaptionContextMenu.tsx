import React from 'react';
import { Scissors, Combine, Trash2 } from 'lucide-react';
import type { Caption } from '../types';

interface CaptionContextMenuProps {
  position: { x: number; y: number };
  caption: Caption;
  onClose: () => void;
  onSplitInto: (parts: 2 | 3 | 4) => void;
  onMerge: () => void;
  onDelete: () => void;
  canMerge: boolean;
  canDelete: boolean;
}

export const CaptionContextMenu: React.FC<CaptionContextMenuProps> = ({
  position,
  caption,
  onClose,
  onSplitInto,
  onMerge,
  onDelete,
  canMerge,
  canDelete
}) => {
  // Close the context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      onClose();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      className="absolute bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50 w-48"
      style={{ 
        left: position.x, 
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1 text-xs font-semibold text-gray-400 border-b border-gray-100">
        Caption Options
      </div>
      
      <button 
        className={`w-full text-left px-4 py-1.5 text-sm flex items-center ${
          canDelete ? 'hover:bg-red-50 text-red-600' : 'opacity-50 cursor-not-allowed'
        }`}
        onClick={canDelete ? onDelete : undefined}
        disabled={!canDelete}
      >
        <Trash2 size={14} className="mr-2" />
        <span className="flex-1">Delete Caption</span>
        <span className="text-xs text-gray-400">Delete</span>
      </button>
      
      <div className="border-t border-gray-100 my-1"></div>
      
      <div className="py-1">
        <div className="px-3 py-1 text-xs font-semibold text-gray-500">
          Split Into
        </div>
        <button 
          className="w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 flex items-center"
          onClick={() => onSplitInto(2)}
        >
          <Scissors size={14} className="mr-2" />
          <span className="flex-1">2 Captions</span>
          <span className="text-xs text-gray-400">Ctrl+2</span>
        </button>
        <button 
          className="w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 flex items-center"
          onClick={() => onSplitInto(3)}
        >
          <Scissors size={14} className="mr-2" />
          <span className="flex-1">3 Captions</span>
          <span className="text-xs text-gray-400">Ctrl+3</span>
        </button>
        <button 
          className="w-full text-left px-4 py-1.5 text-sm hover:bg-blue-50 flex items-center"
          onClick={() => onSplitInto(4)}
        >
          <Scissors size={14} className="mr-2" />
          <span className="flex-1">4 Captions</span>
          <span className="text-xs text-gray-400">Ctrl+4</span>
        </button>
      </div>
      
      <div className="border-t border-gray-100 py-1">
        <button 
          className={`w-full text-left px-4 py-1.5 text-sm flex items-center ${
            canMerge ? 'hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={canMerge ? onMerge : undefined}
          disabled={!canMerge}
        >
          <Combine size={14} className="mr-2" />
          <span className="flex-1">Merge Selected Captions</span>
          <span className="text-xs text-gray-400">Ctrl+M</span>
        </button>
      </div>
    </div>
  );
};