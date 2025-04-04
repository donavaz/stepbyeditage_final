import { v4 as uuidv4 } from 'uuid';
import type { Caption } from '../types';

export function createEmptyCaption(trackId: number, startTime: number = 0): Caption {
  return {
    id: uuidv4(),
    start: startTime,
    end: startTime + 2, // Default 2 second duration
    text: '',
    track: trackId
  };
}

export function createCaptionAtTime(trackId: number, time: number, text: string = ''): Caption {
  return {
    id: uuidv4(),
    start: time,
    end: time + 2, // Default 2 second duration
    text,
    track: trackId
  };
}

export function addCaptionToTrack(trackId: number, time: number, tracks: any[], setTracks: (tracks: any[]) => void) {
  const newCaption = createCaptionAtTime(trackId, time);
  
  setTracks(prevTracks => 
    prevTracks.map(track => 
      track.id === trackId 
        ? { ...track, captions: [...track.captions, newCaption].sort((a, b) => a.start - b.start) }
        : track
    )
  );
  
  return newCaption;
}

/**
 * Split a caption into multiple parts
 * @param caption The caption to split
 * @param parts Number of parts to split into (2, 3, or 4)
 * @returns Array of new caption objects
 */
export function splitCaption(caption: Caption, parts: 2 | 3 | 4): Caption[] {
  // Validate parts
  if (![2, 3, 4].includes(parts)) {
    throw new Error('Parts must be 2, 3, or 4');
  }

  const result: Caption[] = [];
  const duration = caption.end - caption.start;
  const partDuration = duration / parts;
  const text = caption.text;

  // Check if we have exactly the right number of line breaks to split on
  const lineBreakCount = (text.match(/\n/g) || []).length;
  
  if (lineBreakCount === parts - 1) {
    // Split by natural line breaks
    const lines = text.split('\n');
    
    for (let i = 0; i < parts; i++) {
      result.push({
        id: uuidv4(),
        start: caption.start + (i * partDuration),
        end: caption.start + ((i + 1) * partDuration),
        text: lines[i],
        track: caption.track,
        language: caption.language
      });
    }
  } else {
    // Determine if this is a language without spaces (like Japanese or Chinese)
    const hasSpaces = text.includes(' ');
    
    if (hasSpaces) {
      // Split by words for languages with spaces
      const words = text.split(/\s+/);
      const wordsPerPart = Math.ceil(words.length / parts);
      
      for (let i = 0; i < parts; i++) {
        const startIdx = i * wordsPerPart;
        const endIdx = Math.min(startIdx + wordsPerPart, words.length);
        const partText = words.slice(startIdx, endIdx).join(' ');
        
        result.push({
          id: uuidv4(),
          start: caption.start + (i * partDuration),
          end: caption.start + ((i + 1) * partDuration),
          text: partText,
          track: caption.track,
          language: caption.language
        });
      }
    } else {
      // For languages without spaces, split by character count
      const chars = Array.from(text);
      const charsPerPart = Math.ceil(chars.length / parts);
      
      for (let i = 0; i < parts; i++) {
        const startIdx = i * charsPerPart;
        const endIdx = Math.min(startIdx + charsPerPart, chars.length);
        const partText = chars.slice(startIdx, endIdx).join('');
        
        result.push({
          id: uuidv4(),
          start: caption.start + (i * partDuration),
          end: caption.start + ((i + 1) * partDuration),
          text: partText,
          track: caption.track,
          language: caption.language
        });
      }
    }
  }
  
  return result;
}

/**
 * Merge multiple captions into one
 * @param captions Array of captions to merge
 * @returns New merged caption object
 */
export function mergeCaptions(captions: Caption[]): Caption | null {
  if (!captions || captions.length < 2) {
    return null;
  }
  
  // Sort by start time
  const sortedCaptions = [...captions].sort((a, b) => a.start - b.start);
  
  // Extract relevant data from first and last captions
  const firstCaption = sortedCaptions[0];
  const lastCaption = sortedCaptions[sortedCaptions.length - 1];
  const trackId = firstCaption.track;
  
  // Check if captions are from same track
  if (!sortedCaptions.every(caption => caption.track === trackId)) {
    return null;
  }
  
  // Determine if we need to add line breaks between text
  const shouldAddLineBreaks = sortedCaptions.length > 2 || 
    sortedCaptions.some(caption => caption.text.length > 40);
  
  // Combine text
  let mergedText = '';
  sortedCaptions.forEach((caption, index) => {
    if (index === 0) {
      mergedText = caption.text;
    } else {
      const separator = shouldAddLineBreaks ? '\n' : ' ';
      
      // If previous text ends with a punctuation, don't add extra space
      if (!shouldAddLineBreaks && 
          (mergedText.endsWith('.') || 
           mergedText.endsWith('!') || 
           mergedText.endsWith('?') || 
           mergedText.endsWith(',') ||
           mergedText.endsWith(':'))) {
        mergedText += separator.trim() + caption.text;
      } else {
        mergedText += separator + caption.text;
      }
    }
  });
  
  return {
    id: uuidv4(),
    start: firstCaption.start,
    end: lastCaption.end,
    text: mergedText,
    track: trackId,
    language: firstCaption.language
  };
}