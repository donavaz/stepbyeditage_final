import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { Caption, Track, DeeplLanguage } from '../types';

// Error handling class
export class TranslationError extends Error {
  public status?: number;
  public code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'TranslationError';
    this.status = status;
    this.code = code;
  }
}

// Get the Supabase URL from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Fetch supported languages from DeepL API via Supabase Edge Function
 * @returns Array of DeepL supported languages
 */
export async function getDeeplLanguages(): Promise<DeeplLanguage[]> {
  try {
    // Add cache buster to avoid stale responses
    const cacheBuster = Date.now();
    const functionUrl = `${SUPABASE_URL}/functions/v1/deepl-languages?cacheBuster=${cacheBuster}`;
    
    console.log('Fetching DeepL languages from:', functionUrl);
    
    const response = await axios.get(functionUrl, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data?.languages || !Array.isArray(response.data.languages)) {
      console.warn('Invalid response format from deepl-languages function:', response.data);
      throw new TranslationError('Invalid response format from language service');
    }
    
    return response.data.languages || [];
  } catch (error) {
    console.error('Error fetching DeepL languages:', error);
    
    if (axios.isAxiosError(error)) {
      // Add more detailed error information for debugging
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      console.error('Axios error details:', {
        status: statusCode,
        data: responseData,
        config: error.config
      });
      
      if (error.response) {
        throw new TranslationError(
          error.response.data?.error || 'Failed to fetch languages',
          error.response.status,
          error.response.data?.code
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new TranslationError(
          'No response received from language service. Please check your network connection.',
          0,
          'NETWORK_ERROR'
        );
      }
    }
    
    throw new TranslationError(
      error instanceof Error ? error.message : 'Failed to fetch languages'
    );
  }
}

/**
 * Translate a single caption text using DeepL API via Supabase Edge Function
 * @param text The text to translate
 * @param targetLang The target language code
 * @param apiKey DeepL API key
 * @param plan DeepL API plan ('pro' or 'free')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  apiKey: string,
  plan: 'pro' | 'free' = 'pro'
): Promise<string> {
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/deepl-translate`;
    
    console.log(`Translating text to ${targetLang} using ${plan} plan`);
    console.log(`Function URL: ${functionUrl}`);

    // Try using fetch directly first as it may handle CORS better in some cases
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, targetLang, apiKey, plan })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from Supabase function: ${response.status}`, errorText);
        throw new Error(`Function returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data?.translatedText) {
        return data.translatedText;
      } else {
        console.warn('Invalid response format:', data);
        throw new Error('Invalid response format from translation service');
      }
    } catch (fetchError) {
      console.error('Fetch error, trying axios as fallback:', fetchError);
      
      // Fallback to axios if fetch fails
      const response = await axios.post(
        functionUrl, 
        { text, targetLang, apiKey, plan },
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (response.data?.translatedText) {
        return response.data.translatedText;
      } else {
        console.warn('Invalid response format from deepl-translate function:', response.data);
        throw new TranslationError('Invalid response format from translation service');
      }
    }
  } catch (error) {
    console.error('Error translating text:', error);
    
    // Detailed error logging to help diagnose the issue
    if (error instanceof Error) {
      console.error(`Error type: ${error.name}, Message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    
    if (axios.isAxiosError(error) && error.response) {
      throw new TranslationError(
        error.response.data?.error || 'Translation failed',
        error.response.status,
        error.response.data?.code
      );
    } else if (axios.isAxiosError(error) && error.request) {
      throw new TranslationError(
        'No response received from translation service. Please check your network connection.',
        0,
        'NETWORK_ERROR'
      );
    }
    throw new TranslationError(
      error instanceof Error ? error.message : 'Translation failed'
    );
  }
}

/**
 * Batch translate captions to create a new track
 * @param captions Array of captions to translate
 * @param sourceTrack The original track (for metadata)
 * @param targetLang Target language code
 * @param apiKey DeepL API key
 * @param plan DeepL API plan
 * @param onProgress Callback for translation progress
 * @returns New track with translated captions
 */
export async function translateCaptions(
  captions: Caption[],
  sourceTrack: Track,
  targetLang: string,
  apiKey: string,
  plan: 'pro' | 'free' = 'pro',
  onProgress?: (progress: number) => void
): Promise<Track> {
  if (!captions.length) {
    throw new TranslationError('No captions to translate');
  }

  if (!apiKey) {
    throw new TranslationError('DeepL API key is required');
  }

  // Create new track
  const newTrack: Track = {
    id: Date.now(),
    name: `AI Translation (${targetLang})`,
    language: targetLang.toLowerCase(),
    captions: [],
    visible: true,
    fontStyle: sourceTrack.fontStyle || { fontFamily: 'Arial', fontSize: 14 }
  };

  try {
    // Process captions in smaller batches with bigger delays to avoid rate limiting
    const batchSize = 3;
    const total = captions.length;
    const batches = Math.ceil(total / batchSize);
    
    // Clone captions for the new track
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, total);
      const batch = captions.slice(start, end);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (caption) => {
        try {
          const translatedText = await translateText(caption.text, targetLang, apiKey, plan);
          return {
            ...caption,
            id: uuidv4(),
            text: translatedText,
            track: newTrack.id
          };
        } catch (err) {
          // If translation fails for this caption, keep original text
          console.warn(`Failed to translate caption: ${caption.id}`, err);
          return {
            ...caption,
            id: uuidv4(),
            text: `[Translation failed] ${caption.text}`,
            track: newTrack.id
          };
        }
      });
      
      const translatedCaptions = await Promise.all(batchPromises);
      newTrack.captions.push(...translatedCaptions);
      
      // Report progress
      if (onProgress) {
        const progress = Math.min(100, Math.round((end / total) * 100));
        onProgress(progress);
      }
      
      // Add a delay between batches to avoid rate limiting
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return newTrack;
  } catch (error) {
    console.error('Translation error:', error);
    if (error instanceof TranslationError) {
      throw error;
    }
    throw new TranslationError(
      error instanceof Error ? error.message : 'Unknown translation error'
    );
  }
}