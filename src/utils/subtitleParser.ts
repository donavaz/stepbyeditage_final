import type { Caption } from '../types';

export function parseSubtitleFile(content: string): Caption[] {
  const lines = content.trim().split('\n');
  const captions: Caption[] = [];
  let currentCaption: Partial<Caption> = {};
  let index = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (Object.keys(currentCaption).length > 0) {
        captions.push({ ...currentCaption, id: String(index) } as Caption);
        currentCaption = {};
        index++;
      }
      continue;
    }

    if (line.includes('-->')) {
      // Timestamp
      const [start, end] = line.split('-->').map(parseTimestamp);
      currentCaption.start = start;
      currentCaption.end = end;
    } else if (!currentCaption.text) {
      // If no text has been set yet, this line might be the caption number
      const possibleNumber = parseInt(line);
      if (!isNaN(possibleNumber)) {
        // This is a caption number, skip it and use our own index
        continue;
      }
      // If not a number, treat as caption text
      currentCaption.text = line;
    } else {
      // Append additional lines of text
      currentCaption.text = `${currentCaption.text}\n${line}`;
    }
  }

  // Don't forget the last caption
  if (Object.keys(currentCaption).length > 0) {
    captions.push({ ...currentCaption, id: String(index) } as Caption);
  }

  return captions;
}

function parseTimestamp(timestamp: string): number {
  const [time, ms] = timestamp.trim().split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
}