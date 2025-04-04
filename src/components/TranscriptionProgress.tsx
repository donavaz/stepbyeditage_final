import React from 'react';
import { X } from 'lucide-react';

interface TranscriptionProgressProps {
  progress: number;
  message: string;
  onCancel: () => void;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({
  progress,
  message,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transcribing Video</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-600">
            <span>{progress}%</span>
            <span>{message}</span>
          </div>
        </div>
        
        <p className="mb-4 text-gray-600 text-sm">
          Your video is being processed by AssemblyAI. This may take several minutes depending on the length of your video.
          <br /><br />
          Please keep this window open until the process completes.
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};