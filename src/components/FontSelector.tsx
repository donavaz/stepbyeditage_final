import React, { useState, useEffect, useRef } from 'react';
import { Type, ChevronDown } from 'lucide-react';

// Common system fonts including Asian fonts
const COMMON_FONTS = [
  // Western fonts
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Candara',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  // Chinese fonts
  'SimSun',
  'NSimSun',
  'SimHei',
  'Microsoft YaHei',
  'FangSong',
  'KaiTi',
  // Japanese fonts
  'MS Gothic',
  'MS PGothic',
  'MS Mincho',
  'MS PMincho',
  'Meiryo',
  'Yu Gothic',
  'Yu Mincho',
  // Korean fonts
  'Batang',
  'BatangChe',
  'Dotum',
  'DotumChe',
  'Gulim',
  'GulimChe',
  'Malgun Gothic',
  // Generic
  'sans-serif',
  'serif',
  'monospace'
];

// Font sizes
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48];

interface FontSelectorProps {
  value: {
    fontFamily: string;
    fontSize: number;
  };
  onChange: (value: { fontFamily: string; fontSize: number }) => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<string[]>(COMMON_FONTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllFonts, setShowAllFonts] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect available fonts using a more comprehensive approach
  useEffect(() => {
    const detectAvailableFonts = () => {
      // Try to get all system fonts if supported
      if (window.queryLocalFonts) {
        // Use the Local Font Access API if available (Chrome 103+)
        try {
          window.queryLocalFonts().then(
            (fonts) => {
              const systemFonts = [...new Set(fonts.map(font => font.family))];
              console.log(`Detected ${systemFonts.length} system fonts`);
              setAvailableFonts(systemFonts.sort());
            }
          ).catch(err => {
            console.error('Error accessing system fonts:', err);
            fallbackFontDetection();
          });
        } catch (e) {
          console.error('Error accessing system fonts API:', e);
          fallbackFontDetection();
        }
      } else {
        fallbackFontDetection();
      }
    };

    const fallbackFontDetection = () => {
      console.log('Using fallback font detection');
      // Fallback to testing common fonts when Font Access API is not available
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testString = 'mmmmmmmmmmlli';
      const testFonts = [...COMMON_FONTS];
      const detected: string[] = [];

      // Add more Asian fonts to improve detection
      for (const baseFont of baseFonts) {
        const baseWidth = getTextWidth(context, testString, `72px ${baseFont}`);
      
        for (const testFont of testFonts) {
          const testWidth = getTextWidth(context, testString, `72px ${testFont}, ${baseFont}`);
          if (testWidth !== baseWidth) {
            detected.push(testFont);
          }
        }
      }

      // Create a sorted list with no duplicates
      const uniqueFonts = [...new Set(detected)].sort();
      console.log(`Detected ${uniqueFonts.length} fonts with fallback method`);
      setAvailableFonts(uniqueFonts.length > 0 ? uniqueFonts : COMMON_FONTS);
    };

    const getTextWidth = (context: CanvasRenderingContext2D, text: string, font: string) => {
      context.font = font;
      return context.measureText(text).width;
    };

    detectAvailableFonts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter fonts based on search term
  const filteredFonts = searchTerm
    ? availableFonts.filter(font => 
        font.toLowerCase().includes(searchTerm.toLowerCase()))
    : availableFonts;

  // Display fonts: either all or limited number
  const displayFonts = showAllFonts ? filteredFonts : filteredFonts.slice(0, 100);
  const hasMoreFonts = filteredFonts.length > 100 && !showAllFonts;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Font Style"
      >
        <Type size={14} />
        <span className="max-w-[80px] truncate" style={{ fontFamily: value.fontFamily }}>
          {value.fontFamily}, {value.fontSize}px
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-20 w-72 text-black">
          <div className="p-3">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
              <div className="relative">
                <input
                  type="text"
                  ref={inputRef}
                  placeholder="Search fonts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded text-sm mb-2"
                />
              </div>
              
              <div className="border rounded max-h-48 overflow-y-auto">
                {displayFonts.length > 0 ? (
                  <div className="font-list">
                    {displayFonts.map((font) => (
                      <div
                        key={font}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                          font === value.fontFamily ? 'bg-blue-50 font-medium' : ''
                        }`}
                        style={{ fontFamily: font }}
                        onClick={() => onChange({ ...value, fontFamily: font })}
                      >
                        {font}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-gray-500 text-sm">No fonts found matching "{searchTerm}"</div>
                )}
              </div>
              
              {hasMoreFonts && (
                <button
                  className="w-full mt-1 text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => setShowAllFonts(true)}
                >
                  Show all {filteredFonts.length} fonts
                </button>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {availableFonts.length} fonts available
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
              <select
                value={value.fontSize}
                onChange={(e) => onChange({ ...value, fontSize: parseInt(e.target.value) })}
                className="w-full p-2 border rounded text-sm"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 p-2 border rounded bg-gray-50">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <p
                className="text-sm"
                style={{ fontFamily: value.fontFamily, fontSize: `${value.fontSize}px` }}
              >
                The quick brown fox jumps over the lazy dog.
              </p>
              <p
                className="text-sm mt-1"
                style={{ fontFamily: value.fontFamily, fontSize: `${value.fontSize}px` }}
              >
                こんにちは 你好 안녕하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// TypeScript definition for the Local Font Access API
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<Array<{ family: string; fullName: string; postscriptName: string }>>;
  }
}