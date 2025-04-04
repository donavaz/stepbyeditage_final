import type { Caption, Track, ExportFormat } from '../types';
import { formatTimeWithMs } from './timeFormat';

// Helper function to find caption at a specific time point for alignment
const findCaptionAtTime = (captions: Caption[], start: number, end: number): Caption | null => {
  return captions.find(cap => 
    (cap.start <= start && cap.end >= start) || // Caption starts before and ends after the start point
    (cap.start >= start && cap.start <= end) || // Caption starts within the time range
    (cap.start <= start && cap.end >= end)      // Caption completely contains the time range
  ) || null;
};

// Convert captions to SRT format
export const exportToSRT = (captions: Caption[]): string => {
  if (!captions || captions.length === 0) {
    return '';
  }

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start);
  
  let srtContent = '';
  
  sortedCaptions.forEach((caption, index) => {
    // Convert seconds to SRT format (00:00:00,000)
    const startTime = formatSRTTime(caption.start);
    const endTime = formatSRTTime(caption.end);
    
    // Add caption number, time range, and text (preserve line breaks)
    srtContent += `${index + 1}\r\n`;
    srtContent += `${startTime} --> ${endTime}\r\n`;
    // Ensure Windows-style line breaks for maximum compatibility
    srtContent += `${caption.text.replace(/\n/g, '\r\n')}\r\n\r\n`;
  });
  
  return srtContent;
};

// Convert captions to WebVTT format
export const exportToVTT = (captions: Caption[]): string => {
  if (!captions || captions.length === 0) {
    return '';
  }

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start);
  
  // VTT header
  let vttContent = 'WEBVTT\r\n\r\n';
  
  sortedCaptions.forEach((caption, index) => {
    // Convert seconds to VTT format (00:00:00.000)
    const startTime = formatVTTTime(caption.start);
    const endTime = formatVTTTime(caption.end);
    
    // Add caption number, time range, and text (preserve line breaks)
    vttContent += `${index + 1}\r\n`;
    vttContent += `${startTime} --> ${endTime}\r\n`;
    vttContent += `${caption.text.replace(/\n/g, '\r\n')}\r\n\r\n`;
  });
  
  return vttContent;
};

// Export to plain text format - just the text content without timestamps
export const exportToTXT = (captions: Caption[]): string => {
  if (!captions || captions.length === 0) {
    return '';
  }

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start);
  
  let txtContent = '';
  
  sortedCaptions.forEach((caption) => {
    // Just include the text (preserve line breaks)
    txtContent += `${caption.text.replace(/\n/g, '\r\n')}\r\n\r\n`;
  });
  
  return txtContent;
};

// Properly escape a CSV field
const escapeCSVField = (field: any): string => {
  // Convert to string if it's not already
  const str = String(field);
  
  // If the field contains a comma, newline, or double-quote, it needs special handling
  if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
    // Double any double-quotes and enclose in double-quotes
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

// Export to CSV format
export const exportToCSV = (captions: Caption[]): string => {
  if (!captions || captions.length === 0) {
    return '';
  }

  // Sort captions by start time
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start);
  
  // CSV header with CRLF line endings for better Excel compatibility
  let csvContent = 'Number,Start Time,End Time,Text\r\n';
  
  sortedCaptions.forEach((caption, index) => {
    // Format and properly escape data for CSV
    const row = [
      index + 1,
      formatCSVTime(caption.start),
      formatCSVTime(caption.end),
      caption.text // This will be properly escaped by escapeCSVField
    ].map(escapeCSVField);
    
    csvContent += row.join(',') + '\r\n';
  });
  
  return csvContent;
};

// Special function for bilingual/multilingual CSV export
export const exportToBilingualCSV = (
  tracks: Track[],
  options: { primaryTrack?: number; secondaryTrack?: number }
): string => {
  if (!tracks || tracks.length === 0) {
    return '';
  }
  
  let allTracks: Track[];
  
  // If specific tracks are selected for bilingual export
  if (options.primaryTrack && options.secondaryTrack) {
    const primaryTrack = tracks.find(t => t.id === options.primaryTrack);
    const secondaryTrack = tracks.find(t => t.id === options.secondaryTrack);
    
    if (!primaryTrack || !secondaryTrack) {
      return 'Selected tracks not found';
    }
    
    allTracks = [primaryTrack, secondaryTrack];
  } else {
    // Use all visible tracks if no specific tracks are selected
    allTracks = tracks.filter(track => track.visible);
  }
  
  if (allTracks.length === 0) {
    return '';
  }
  
  // Create headers with just language names
  const headers = ['Number', 'Start Time', 'End Time'];
  allTracks.forEach(track => {
    headers.push(`${track.language} text`);
  });
  
  // Use CRLF line endings for better Excel compatibility
  let csvContent = headers.map(escapeCSVField).join(',') + '\r\n';
  
  // Instead of creating time segments, use primary track captions as anchors
  const primaryTrack = allTracks[0];
  
  // Sort captions by start time
  const sortedCaptions = [...primaryTrack.captions].sort((a, b) => a.start - b.start);
  
  // Go through each primary caption and find matching captions in other tracks
  sortedCaptions.forEach((primaryCaption, index) => {
    const row = [
      index + 1,
      formatCSVTime(primaryCaption.start),
      formatCSVTime(primaryCaption.end),
      primaryCaption.text
    ];
    
    // For each secondary track, find a caption that overlaps with this time range
    for (let i = 1; i < allTracks.length; i++) {
      const track = allTracks[i];
      const matchingCaption = track.captions.find(cap => 
        (cap.start <= primaryCaption.start && cap.end >= primaryCaption.start) || // Caption starts before and ends after primary start
        (cap.start >= primaryCaption.start && cap.start <= primaryCaption.end) || // Caption starts within primary time range
        (cap.start <= primaryCaption.start && cap.end >= primaryCaption.end)      // Caption completely contains primary time range
      );
      
      row.push(matchingCaption ? matchingCaption.text : '');
    }
    
    csvContent += row.map(escapeCSVField).join(',') + '\r\n';
  });
  
  return csvContent;
};

// Helper function to format time for SRT (00:00:00,000)
const formatSRTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// Helper function to format time for WebVTT (00:00:00.000)
const formatVTTTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

// Helper function to format time for CSV (00:00:00:00)
const formatCSVTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
};

// Save exported content as a file with proper encoding
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  try {
    // BOM for UTF-8
    const UTF8_BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    
    // Create a blob with BOM at the beginning to ensure proper UTF-8 encoding
    const blob = new Blob([UTF8_BOM, content], { 
      type: `${mimeType}; charset=UTF-8` 
    });
    
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // More reliable way to trigger download across browsers
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200); // Longer timeout to ensure download begins
  } catch (error) {
    console.error('Error downloading file:', error);
    alert(`Error downloading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main export function that handles all formats
export const exportCaptions = (
  tracks: Track[],
  format: ExportFormat,
  options?: any
): void => {
  if (!tracks || tracks.length === 0) {
    alert('No captions to export');
    return;
  }
  
  let filename = 'captions';
  let content = '';
  let mimeType = 'text/plain';
  
  // Handle bilingual export specially - only for CSV format
  if (format === 'csv' && options?.bilingual && options.primaryTrack && options.secondaryTrack) {
    content = exportToBilingualCSV(tracks, {
      primaryTrack: options.primaryTrack,
      secondaryTrack: options.secondaryTrack
    });
    filename = `multilingual_captions_${tracks.find(t => t.id === options.primaryTrack)?.language || 'primary'}_${tracks.find(t => t.id === options.secondaryTrack)?.language || 'secondary'}.csv`;
    mimeType = 'text/csv';
  } else {
    // For standard export, use captions from a single track or specified tracks
    let captions: Caption[] = [];
    let trackName = '';
    
    if (options?.tracks && options.tracks.length > 0) {
      // Get the track we want to export
      const trackToExport = tracks.find(track => track.id === options.tracks[0]);
      if (trackToExport) {
        captions = [...trackToExport.captions];
        trackName = trackToExport.name;
      }
    } else {
      // Fallback: use first visible track
      const firstVisibleTrack = tracks.find(track => track.visible);
      if (firstVisibleTrack) {
        captions = [...firstVisibleTrack.captions];
        trackName = firstVisibleTrack.name;
      }
    }
    
    // Sort captions by start time
    captions.sort((a, b) => a.start - b.start);
    
    // Set a track-specific filename
    const sanitizedTrackName = trackName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Export based on format
    switch (format) {
      case 'srt':
        content = exportToSRT(captions);
        filename = `${sanitizedTrackName}_captions.srt`;
        mimeType = 'text/plain';
        break;
      case 'vtt':
        content = exportToVTT(captions);
        filename = `${sanitizedTrackName}_captions.vtt`;
        mimeType = 'text/plain';
        break;
      case 'txt':
        content = exportToTXT(captions);
        filename = `${sanitizedTrackName}_captions.txt`;
        mimeType = 'text/plain';
        break;
      case 'csv':
        content = exportToCSV(captions);
        filename = `${sanitizedTrackName}_captions.csv`;
        mimeType = 'text/csv';
        break;
      default:
        alert('Unsupported export format');
        return;
    }
  }
  
  // Download the file
  downloadFile(content, filename, mimeType);
};