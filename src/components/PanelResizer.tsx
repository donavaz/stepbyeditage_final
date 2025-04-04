import React, { useState, useEffect } from 'react';

interface PanelResizerProps {
  onResize: (leftWidthPercentage: number) => void;
  initialLeftWidth?: number; // In percentage (0-100)
  minLeftWidth?: number; // In percentage
  maxLeftWidth?: number; // In percentage
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
  onResize,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate the new width as a percentage of the window width
      const windowWidth = window.innerWidth;
      const newLeftWidthPx = e.clientX;
      const newLeftWidthPercentage = (newLeftWidthPx / windowWidth) * 100;

      // Ensure the width stays within min and max constraints
      const constrainedWidth = Math.min(
        Math.max(newLeftWidthPercentage, minLeftWidth),
        maxLeftWidth
      );

      onResize(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add event listeners when dragging starts
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Clean up event listeners when dragging ends or component unmounts
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, onResize]);

  return (
    <div
      className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize relative z-10 ${
        isDragging ? 'bg-blue-500' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle icon - optional */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-1 h-8 bg-gray-400"></div>
      </div>
      
      {/* Extended hit area for easier grabbing */}
      <div className="absolute inset-0 w-4 -left-1.5 cursor-col-resize"></div>
    </div>
  );
};