import React from 'react';
import { formatTime } from '../utils/timeFormat';
import { PX_PER_SECOND } from '../utils/constants';

interface TimeColumnProps {
  duration: number;
}

export const TimeColumn: React.FC<TimeColumnProps> = ({ duration }) => {
  const totalSeconds = Math.ceil(duration || 0);
  const timelineHeight = Math.max(totalSeconds * PX_PER_SECOND, 600);
  const tickCount = Math.max(totalSeconds, 15);

  return (
    <div className="w-20 bg-[#f5f5e6] border-r border-gray-700 relative flex-shrink-0">
      {/* Time Column Header */}
      <div className="h-10 bg-white-800 flex items-center justify-center sticky top-0 z-10 border-b border-gray-700">
        <span className="font-medium text-black-100">Time</span>
      </div>

      {/* Time Markers */}
      <div className="relative" style={{ height: `${timelineHeight}px` }}>
        {Array.from({ length: tickCount }).map((_, i) => {
          const topPx = i * PX_PER_SECOND;

          return (
            <React.Fragment key={i}>
              {/* Major second marker */}
              <div
                className="absolute left-0 right-0 border-t border-gray-500"
                style={{ top: `${topPx}px`, height: `${PX_PER_SECOND}px` }}
              />

              {/* Time Label OVERLAPPING the line */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-10 bg-[#f5f5e6] text-[11px] leading-none font-semibold text-black px-1 border border-gray-400 rounded"
                style={{
                  top: `${topPx - 6}px` // push it up into the line for ruler-style overlap
                }}
              >
                {formatTime(i)}
              </div>

              {/* Minor tick marks - 4 per second */}
              {[1, 2, 3, 4].map((tick) => {
                const minorTickPosition = topPx + (tick * (PX_PER_SECOND / 5));
                
                return (
                  <React.Fragment key={`${i}-${tick}`}>
                    {/* Left minor tick */}
                    <div
                      className="absolute left-0 border-t border-gray-300"
                      style={{ 
                        top: `${minorTickPosition}px`,
                        height: '1px',
                        width: '25%'
                      }}
                    />
                    
                    {/* Right minor tick */}
                    <div
                      className="absolute right-0 border-t border-gray-300"
                      style={{ 
                        top: `${minorTickPosition}px`,
                        height: '1px',
                        width: '25%'
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};