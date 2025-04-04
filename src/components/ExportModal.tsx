import React, { useState, useEffect } from 'react';
import { X, FileDown } from 'lucide-react';
import type { ExportFormat, Track } from '../types';

interface ExportModalProps {
  onClose: () => void;
  onExport: (format: ExportFormat, options?: any) => void;
  tracks: Track[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  onExport,
  tracks,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('srt');
  const [isBilingual, setIsBilingual] = useState(false);
  const [primaryTrack, setPrimaryTrack] = useState<number | null>(null);
  const [secondaryTrack, setSecondaryTrack] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  
  // Get visible tracks
  const visibleTracks = tracks.filter(track => track.visible);
  
  // Set default tracks when modal opens
  useEffect(() => {
    if (visibleTracks.length > 0) {
      // Set the first visible track as the default selected track for single-track exports
      setSelectedTrack(visibleTracks[0].id);
      
      // For bilingual/multilingual exports, set the first two tracks as defaults
      setPrimaryTrack(visibleTracks[0].id);
      
      if (visibleTracks.length > 1) {
        setSecondaryTrack(visibleTracks[1].id);
      }
    }
  }, [visibleTracks]);
  
  const handleExport = () => {
    if (selectedFormat === 'csv' && isBilingual && primaryTrack && secondaryTrack) {
      // Export bilingual/multilingual CSV
      onExport(selectedFormat, {
        bilingual: true,
        primaryTrack,
        secondaryTrack
      });
    } else if (selectedTrack) {
      // Export single selected track
      onExport(selectedFormat, {
        tracks: [selectedTrack]
      });
    } else {
      // Fallback: export all visible tracks
      onExport(selectedFormat, {
        tracks: visibleTracks.map(t => t.id)
      });
    }
    
    onClose();
  };
  
  // Show bilingual option only when we have 2+ visible tracks and CSV format is selected
  const showBilingualOption = visibleTracks.length >= 2 && selectedFormat === 'csv';
  
  // Get the name of the selected track for display
  const selectedTrackName = selectedTrack 
    ? tracks.find(t => t.id === selectedTrack)?.name 
    : 'No track selected';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileDown size={20} />
            Export Captions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`px-4 py-3 rounded-md text-left ${
                  selectedFormat === 'srt'
                    ? 'bg-blue-100 border-blue-500 border text-blue-800'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setSelectedFormat('srt');
                  setIsBilingual(false);
                }}
              >
                <div className="font-semibold">SRT</div>
                <div className="text-xs text-gray-600">
                  SubRip format, compatible with most video players
                </div>
              </button>
              
              <button
                className={`px-4 py-3 rounded-md text-left ${
                  selectedFormat === 'vtt'
                    ? 'bg-blue-100 border-blue-500 border text-blue-800'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setSelectedFormat('vtt');
                  setIsBilingual(false);
                }}
              >
                <div className="font-semibold">VTT</div>
                <div className="text-xs text-gray-600">
                  WebVTT format, best for web players
                </div>
              </button>
              
              <button
                className={`px-4 py-3 rounded-md text-left ${
                  selectedFormat === 'csv'
                    ? 'bg-blue-100 border-blue-500 border text-blue-800'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedFormat('csv')}
              >
                <div className="font-semibold">CSV</div>
                <div className="text-xs text-gray-600">
                  Spreadsheet format, easy to edit
                </div>
              </button>
              
              <button
                className={`px-4 py-3 rounded-md text-left ${
                  selectedFormat === 'txt'
                    ? 'bg-blue-100 border-blue-500 border text-blue-800'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setSelectedFormat('txt');
                  setIsBilingual(false);
                }}
              >
                <div className="font-semibold">TXT</div>
                <div className="text-xs text-gray-600">
                  Plain text format
                </div>
              </button>
            </div>
          </div>

          {/* Track selection for all formats */}
          {!isBilingual && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Track to Export
              </label>
              
              <select
                value={selectedTrack || ''}
                onChange={(e) => setSelectedTrack(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="">Select a track</option>
                {visibleTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name} ({track.language})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multi-language option for CSV format */}
          {showBilingualOption && (
            <div>
              <label className="flex items-center cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={isBilingual}
                  onChange={() => {
                    setIsBilingual(!isBilingual);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Multi-language export (side-by-side captions)
                </span>
              </label>
              
              {isBilingual && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Language
                    </label>
                    <select
                      value={primaryTrack || ''}
                      onChange={(e) => setPrimaryTrack(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    >
                      <option value="">Select Track</option>
                      {visibleTracks.map((track) => (
                        <option key={`primary-${track.id}`} value={track.id}>
                          {track.name} ({track.language})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Language
                    </label>
                    <select
                      value={secondaryTrack || ''}
                      onChange={(e) => setSecondaryTrack(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    >
                      <option value="">Select Track</option>
                      {visibleTracks
                        .filter(track => track.id !== primaryTrack)
                        .map((track) => (
                          <option key={`secondary-${track.id}`} value={track.id}>
                            {track.name} ({track.language})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-4">
              {isBilingual 
                ? `Exporting multi-language captions with ${visibleTracks.find(t => t.id === primaryTrack)?.name || 'Primary'} 
                   and ${visibleTracks.find(t => t.id === secondaryTrack)?.name || 'Secondary'} tracks` 
                : `Exporting track: ${selectedTrackName}`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                  (isBilingual && (!primaryTrack || !secondaryTrack)) ||
                  (!isBilingual && !selectedTrack)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                disabled={
                  (isBilingual && (!primaryTrack || !secondaryTrack)) ||
                  (!isBilingual && !selectedTrack)
                }
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};