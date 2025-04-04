import { createClient } from 'npm:@supabase/supabase-js';
import axios from 'npm:axios';

// Explicitly handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Extract the request information
    const url = new URL(req.url);
    const queryCacheBuster = url.searchParams.get('cacheBuster'); // To prevent caching if needed
    
    const auth = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // Use the environment variables if available, otherwise fallback to header auth
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: { headers: { Authorization: auth || '' } },
        auth: { persistSession: false },
      }
    );

    // Define a static fallback of supported languages
    const fallbackLanguages = [
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
      { language: 'ID', name: 'Indonesian' },
      { language: 'IT', name: 'Italian' },
      { language: 'JA', name: 'Japanese' },
      { language: 'KO', name: 'Korean' },
      { language: 'LT', name: 'Lithuanian' },
      { language: 'LV', name: 'Latvian' },
      { language: 'NB', name: 'Norwegian (Bokmål)' },
      { language: 'NL', name: 'Dutch' },
      { language: 'PL', name: 'Polish' },
      { language: 'PT-BR', name: 'Portuguese (Brazilian)' },
      { language: 'PT-PT', name: 'Portuguese (European)' },
      { language: 'RO', name: 'Romanian' },
      { language: 'RU', name: 'Russian' },
      { language: 'SK', name: 'Slovak' },
      { language: 'SL', name: 'Slovenian' },
      { language: 'SV', name: 'Swedish' },
      { language: 'TR', name: 'Turkish' },
      { language: 'UK', name: 'Ukrainian' },
      { language: 'ZH', name: 'Chinese (simplified)' }
    ];

    // First try to fetch from DeepL API directly since we don't need caching yet
    try {
      const response = await axios.get('https://api-free.deepl.com/v2/languages', {
        params: { 
          type: 'target' // Get target languages (what we can translate to)
        },
        headers: {
          // Note: We're using a dummy key here since we just want the list of supported languages
          // which is the same regardless of key. A real key would be used for actual translations.
          'Authorization': 'DeepL-Auth-Key 00000000-0000-0000-0000-000000000000',
          'User-Agent': 'CaptionEditorApp/1.0'
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.status === 200 && response.data) {
        // Successfully got languages from DeepL API
        return new Response(
          JSON.stringify({ 
            languages: response.data,
            source: 'api' 
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch (apiError) {
      console.log('DeepL API call failed, using fallback languages');
      // Continue to fallback instead of throwing
    }

    // If we get here, API call failed - return our fallback list
    return new Response(
      JSON.stringify({
        languages: fallbackLanguages,
        source: 'fallback'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error in deepl-languages function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve languages',
        details: error.message,
        languages: [
          // Return basic fallback languages even in error case
          { language: 'EN-US', name: 'English (American)' },
          { language: 'ES', name: 'Spanish' },
          { language: 'FR', name: 'French' },
          { language: 'DE', name: 'German' },
          { language: 'JA', name: 'Japanese' }
        ]
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});