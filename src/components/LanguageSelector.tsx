import React, { useEffect, useState } from 'react';

interface LanguageSelectorProps {
  onLanguageSelect: (language: string) => void;
  onClose?: () => void; // Escape/cancel handler
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelect,
  onClose,
}) => {
  const allLanguages = [
    { code: 'en-global', name: 'Global English', flag: '🌐' },
    { code: 'en-au', name: 'Australian English', flag: '🇦🇺' },
    { code: 'en-gb', name: 'British English', flag: '🇬🇧' },
    { code: 'en-us', name: 'American English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
    { code: 'as', name: 'Assamese', flag: '🇮🇳' },
    { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'ba', name: 'Bashkir', flag: '🌍' },
    { code: 'eu', name: 'Basque', flag: '🇪🇸' },
    { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
    { code: 'br', name: 'Breton', flag: '🏴' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'my', name: 'Burmese', flag: '🇲🇲' },
    { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'et', name: 'Estonian', flag: '🇪🇪' },
    { code: 'fo', name: 'Faroese', flag: '🇫🇴' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'gl', name: 'Galician', flag: '🇪🇸' },
    { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'ht', name: 'Haitian', flag: '🇭🇹' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'haw', name: 'Hawaiian', flag: '🌺' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'jv', name: 'Javanese', flag: '🇮🇩' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
    { code: 'km', name: 'Khmer', flag: '🇰🇭' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'lo', name: 'Lao', flag: '🇱🇦' },
    { code: 'la', name: 'Latin', flag: '🏛️' },
    { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
    { code: 'ln', name: 'Lingala', flag: '🌍' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
    { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
    { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
    { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
    { code: 'mi', name: 'Maori', flag: '🇳🇿' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
    { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'nn', name: 'Norwegian Nynorsk', flag: '🇳🇴' },
    { code: 'oc', name: 'Occitan', flag: '🇫🇷' },
    { code: 'pa', name: 'Panjabi', flag: '🇮🇳' },
    { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'sa', name: 'Sanskrit', flag: '🕉️' },
    { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
    { code: 'sn', name: 'Shona', flag: '🇿🇼' },
    { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
    { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
    { code: 'so', name: 'Somali', flag: '🇸🇴' },
    { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
    { code: 'sw', name: 'Swahili', flag: '🌍' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'tt', name: 'Tatar', flag: '🇷🇺' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'bo', name: 'Tibetan', flag: '🇨🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'tk', name: 'Turkmen', flag: '🇹🇲' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'cy', name: 'Welsh', flag: '🏴' },
    { code: 'yi', name: 'Yiddish', flag: '✡️' },
    { code: 'yo', name: 'Yoruba', flag: '🌍' },
  ];

  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredLanguages = allLanguages
    .filter((lang) => lang.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        <h2 className="text-xl font-semibold mb-4">Select Caption Language</h2>

        <input
          type="text"
          placeholder="Search language..."
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              className="px-4 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2"
              onClick={() => onLanguageSelect(lang.code)}
            >
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
