import axios from 'axios';

export interface TranscriptionResult {
  text: string;
  words: {
    text: string;
    start: number;
    end: number;
    confidence: number;
  }[];
  utterances: {
    text: string;
    start: number;
    end: number;
  }[];
  srt?: string;
  error?: string;
}

export async function transcribeVideo(
  file: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<TranscriptionResult> {
  try {
    if (!apiKey) {
      throw new Error('AssemblyAI API key is required');
    }

    if (!file) {
      throw new Error('Video file is required');
    }

    if (onProgress) onProgress(10);
    
    console.log("Starting file upload...");
    
    // First, upload the file directly to AssemblyAI
    if (onProgress) onProgress(20);
    
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      file,
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/octet-stream',
          'Transfer-Encoding': 'chunked'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const uploadPercent = Math.min(20 + (progressEvent.loaded / progressEvent.total) * 20, 40);
            onProgress(Math.floor(uploadPercent));
          }
        }
      }
    );

    if (!uploadResponse.data?.upload_url) {
      console.error("Upload response:", uploadResponse.data);
      throw new Error('Failed to upload file to AssemblyAI: No upload_url in response');
    }
    
    console.log("File uploaded successfully, audio URL:", uploadResponse.data.upload_url);
    
    if (onProgress) onProgress(40);
    
    // Start transcription using the uploaded file URL
    console.log("Starting transcription...");
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadResponse.data.upload_url,
        language_detection: true,
        punctuate: true,
        format_text: true,
        speaker_labels: true
      },
      {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!transcriptResponse.data?.id) {
      console.error("Transcript response:", transcriptResponse.data);
      throw new Error('Failed to start transcription: No transcript ID in response');
    }
    
    const transcriptId = transcriptResponse.data.id;
    console.log("Transcription initiated, transcript ID:", transcriptId);
    
    // Poll for completion
    let pollingCount = 0;
    let transcriptResult;
    
    while (pollingCount < 120) { // Max 10 minutes (120 * 5s = 600s)
      pollingCount++;
      
      // Update progress (from 40% to 95%)
      if (onProgress) {
        const progress = 40 + Math.min(55, Math.floor((pollingCount / 120) * 55));
        onProgress(progress);
      }
      
      // Get transcript status
      console.log(`Polling for transcript status (attempt ${pollingCount})...`);
      const pollingResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': apiKey
          }
        }
      );
      
      const status = pollingResponse.data.status;
      console.log(`Current status: ${status}`);
      
      if (status === 'completed') {
        transcriptResult = pollingResponse.data;
        break;
      } else if (status === 'error') {
        console.error("Transcription error:", pollingResponse.data.error);
        throw new Error(`Transcription failed: ${pollingResponse.data.error || 'Unknown error'}`);
      }
      
      // Wait 5 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    if (!transcriptResult) {
      throw new Error('Transcription timed out after 10 minutes');
    }
    
    if (onProgress) onProgress(95);
    
    // Get SRT directly from the API
    console.log("Getting SRT format...");
    let srtContent = '';
    try {
      const srtResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}/srt`,
        {
          headers: {
            'Authorization': apiKey
          }
        }
      );
      
      srtContent = srtResponse.data;
      console.log("SRT generated successfully");
    } catch (error) {
      console.warn('Failed to get SRT directly, will generate from words', error);
      // Fall back to generating SRT from words
      if (transcriptResult.words && transcriptResult.words.length > 0) {
        srtContent = generateSrtFromWords(transcriptResult.words);
        console.log("SRT generated from words as fallback");
      }
    }
    
    if (onProgress) onProgress(100);
    
    // Format the result
    return {
      text: transcriptResult.text || '',
      words: transcriptResult.words || [],
      utterances: transcriptResult.utterances || [],
      srt: srtContent
    };
  } catch (error: any) {
    console.error('Transcription error:', error);
    let errorMessage = 'Unknown error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('AssemblyAI API error response:', error.response.data);
      errorMessage = error.response.data?.error || error.response.statusText || error.message;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('AssemblyAI API error request:', error.request);
      errorMessage = 'No response received from server';
    } else if (error.message) {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }
    
    return {
      text: '',
      words: [],
      utterances: [],
      error: errorMessage
    };
  }
}

// Generate SRT from words (fallback if API doesn't provide SRT)
function generateSrtFromWords(words: any[]): string {
  if (!words || words.length === 0) {
    return '';
  }
  
  const MAX_CHARS_PER_LINE = 42;
  const MAX_DURATION = 5; // Max caption duration in seconds
  
  let srtOutput = '';
  let captionIndex = 1;
  let currentCaption: { text: string; start: number; end: number } = {
    text: '',
    start: 0,
    end: 0
  };
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Start a new caption if needed
    if (currentCaption.text === '') {
      currentCaption.start = word.start;
      currentCaption.text = word.text;
      currentCaption.end = word.end;
      continue;
    }
    
    const potentialText = `${currentCaption.text} ${word.text}`;
    
    // Check if adding this word would exceed the max chars per line
    // or if the duration would be too long
    if (
      potentialText.length > MAX_CHARS_PER_LINE ||
      word.end - currentCaption.start > MAX_DURATION
    ) {
      // Write the current caption
      srtOutput += `${captionIndex}\n`;
      srtOutput += `${formatTime(currentCaption.start)} --> ${formatTime(currentCaption.end)}\n`;
      srtOutput += `${currentCaption.text}\n\n`;
      
      // Start a new caption
      captionIndex++;
      currentCaption.text = word.text;
      currentCaption.start = word.start;
      currentCaption.end = word.end;
    } else {
      // Add the word to the current caption
      currentCaption.text = potentialText;
      currentCaption.end = word.end;
    }
  }
  
  // Add the last caption
  if (currentCaption.text) {
    srtOutput += `${captionIndex}\n`;
    srtOutput += `${formatTime(currentCaption.start)} --> ${formatTime(currentCaption.end)}\n`;
    srtOutput += `${currentCaption.text}\n\n`;
  }
  
  return srtOutput;
}

// Convert transcription result to SRT format
export function convertToSRT(result: TranscriptionResult): string {
  // If we already have SRT content from AssemblyAI, use it
  if (result.srt) {
    return result.srt;
  }
  
  return generateSrtFromWords(result.words);
}