import React, { useEffect, useState } from 'react';
import { X, Globe, Languages } from 'lucide-react';
import type { DeeplLanguage } from '../types';
import { getDeeplLanguages } from '../services/translationService';

interface TranslationModalProps {
  onClose: () => void;
  onTranslate: (targetLang: string) => void;
  sourceLang?: string;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  onClose,
  onTranslate,
  sourceLang,
}) => {
  const [languages, setLanguages] = useState<DeeplLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const languages = await getDeeplLanguages();
        setLanguages(languages);
        setError(null);
      } catch (err) {
        console.error('Error fetching languages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load languages');
        
        // Fallback to static list of common languages if API fails
        setLanguages([
          { language: 'BG', name: 'Bulgarian' },
          { language: 'CS', name: 'Czech' },
          { language: 'DA', name: 'Danish' },
          { language: 'DE', name: 'German' },
          { language: 'EL', name: 'Greek' },
          { language: 'EN-GB', name: 'English (British)' },
          { language: 'EN-US', name: 'English (American)' },
          { language: 'ES', name: 'Spanish' },
          { language: 'ET', name: 'Estonian' },
          { language: 'FI', name: 'Finnish' },
          { language: 'FR', name: 'French' },
          { language: 'HU', name: 'Hungarian' },
          { language: 'IT', name: 'Italian' },
          { language: 'JA', name: 'Japanese' },
          { language: 'LT', name: 'Lithuanian' },
          { language: 'LV', name: 'Latvian' },
          { language: 'NL', name: 'Dutch' },
          { language: 'PL', name: 'Polish' },
          { language: 'PT-PT', name: 'Portuguese' },
          { language: 'RO', name: 'Romanian' },
          { language: 'RU', name: 'Russian' },
          { language: 'SK', name: 'Slovak' },
          { language: 'SL', name: 'Slovenian' },
          { language: 'SV', name: 'Swedish' },
          { language: 'ZH', name: 'Chinese' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredLanguages = languages
    .filter(lang => 
      lang.name.toLowerCase().includes(search.toLowerCase()) ||
      lang.language.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode);
  };

  const handleSubmit = () => {
    if (selectedLang) {
      onTranslate(selectedLang);
    }
  };

  const getLanguageFlag = (langCode: string): string => {
    // Simple mapping for common languages
    const flagMap: Record<string, string> = {
      'EN': '🇬🇧',
      'EN-GB': '🇬🇧',
      'EN-US': '🇺🇸',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'ES': '🇪🇸',
      'IT': '🇮🇹',
      'JA': '🇯🇵',
      'ZH': '🇨🇳',
      'PT': '🇵🇹',
      'PT-PT': '🇵🇹',
      'PT-BR': '🇧🇷',
      'RU': '🇷🇺',
      'NL': '🇳🇱',
      'PL': '🇵🇱',
      'SV': '🇸🇪',
      'BG': '🇧🇬',
      'CS': '🇨🇿',
      'DA': '🇩🇰',
      'ET': '🇪🇪',
      'FI': '🇫🇮',
      'EL': '🇬🇷',
      'HU': '🇭🇺',
      'ID': '🇮🇩',
      'LV': '🇱🇻',
      'LT': '🇱🇹',
      'RO': '🇷🇴',
      'SK': '🇸🇰',
      'SL': '🇸🇮',
      'TR': '🇹🇷',
      'UK': '🇺🇦',
      'KO': '🇰🇷',
      'NB': '🇳🇴',
    };
    
    return flagMap[langCode] || '🌐';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Languages size={20} />
            Translate Captions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading available languages...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md mb-4">
            <p className="font-semibold">Note</p>
            <p className="text-sm">Using a predefined list of languages. To get the full list of supported languages, please provide a valid DeepL API key in Settings.</p>
          </div>
        ) : null}

        <div className="mb-4">
          <p className="mb-2 text-gray-600">
            Select a target language to translate your captions to.
            {sourceLang && (
              <span className="font-medium"> Source language: {sourceLang.toUpperCase()}</span>
            )}
          </p>
          <input
            type="text"
            placeholder="Search languages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto mb-4">
          {filteredLanguages.length > 0 ? (
            filteredLanguages.map((lang) => (
              <button
                key={lang.language}
                className={`flex items-center gap-2 p-3 rounded-md text-left ${
                  selectedLang === lang.language 
                    ? 'bg-blue-100 border border-blue-400' 
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
                onClick={() => handleLanguageSelect(lang.language)}
              >
                <span className="text-xl">{getLanguageFlag(lang.language)}</span>
                <div>
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-500">{lang.language}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No languages found matching "{search}"
            </div>
          )}
        </div>

        <div className="flex justify-between space-x-3 pt-2 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Uses Supabase Edge Functions to call DeepL API
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedLang}
              className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                selectedLang 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Translate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};