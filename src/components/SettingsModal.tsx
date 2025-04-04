import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Settings } from '../types';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Settings>({
    assemblyAiKey: settings.assemblyAiKey || '',
    deeplKey: settings.deeplKey || '',
    deeplPlan: settings.deeplPlan || 'pro',
    showCaptionsInFullscreen: settings.showCaptionsInFullscreen !== false,
    autosaveInterval: settings.autosaveInterval || 30,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">API Keys</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="assemblyAiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    AssemblyAI API Key
                  </label>
                  <input
                    type="text"
                    id="assemblyAiKey"
                    name="assemblyAiKey"
                    value={formData.assemblyAiKey}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your AssemblyAI API key"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for auto-transcription. Get a key at{' '}
                    <a
                      href="https://www.assemblyai.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      AssemblyAI
                    </a>
                  </p>
                </div>

                <div>
                  <label htmlFor="deeplPlan" className="block text-sm font-medium text-gray-700 mb-1">
                    DeepL API Plan
                  </label>
                  <select
                    id="deeplPlan"
                    name="deeplPlan"
                    value={formData.deeplPlan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pro">Pro</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="deeplKey" className="block text-sm font-medium text-gray-700 mb-1">
                    DeepL API Key
                  </label>
                  <input
                    type="text"
                    id="deeplKey"
                    name="deeplKey"
                    value={formData.deeplKey}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your DeepL API key"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Required for auto-translation. Get a key at{' '}
                    <a
                      href="https://www.deepl.com/pro#developer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      DeepL
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Display Options</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showCaptionsInFullscreen"
                    name="showCaptionsInFullscreen"
                    checked={formData.showCaptionsInFullscreen}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showCaptionsInFullscreen" className="ml-2 block text-sm text-gray-700">
                    Show captions in fullscreen mode
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Auto-save</h3>
              <div className="flex items-center">
                <label htmlFor="autosaveInterval" className="block text-sm text-gray-700 mr-2">
                  Save every
                </label>
                <input
                  type="number"
                  id="autosaveInterval"
                  name="autosaveInterval"
                  min="0"
                  max="120"
                  value={formData.autosaveInterval}
                  onChange={handleChange}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">seconds (0 to disable)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};