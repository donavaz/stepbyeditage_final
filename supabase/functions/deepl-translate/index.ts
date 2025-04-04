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
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { text, targetLang, apiKey, plan } = body;

    console.log(`Processing translation request to ${targetLang}`);

    if (!text || !targetLang || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Set correct DeepL API endpoint based on plan
    const endpoint = plan === 'free'
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    // Create form data instead of URLSearchParams
    const formData = new FormData();
    formData.append('auth_key', apiKey);
    formData.append('text', text);
    formData.append('target_lang', targetLang);

    console.log(`Sending request to DeepL API: ${endpoint}`);

    // Make a direct fetch request instead of using axios
    const deeplResponse = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!deeplResponse.ok) {
      const errorData = await deeplResponse.text();
      console.error(`DeepL API error: ${deeplResponse.status}, ${errorData}`);
      throw new Error(`DeepL API returned ${deeplResponse.status}: ${errorData}`);
    }

    const responseData = await deeplResponse.json();
    const translatedText = responseData?.translations?.[0]?.text || '';

    console.log('Translation successful');

    return new Response(
      JSON.stringify({ translatedText }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('DeepL Translation Error:', error);
    
    // Extract error details if available
    let errorMessage = 'Translation failed';
    let statusCode = 500;
    
    if (error.response) {
      // The API responded with an error
      errorMessage = error.response.data?.message || error.response.data?.error || 'Translation API error';
      statusCode = error.response.status || 500;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from translation service';
    } else {
      // Something else went wrong
      errorMessage = error.message || 'Unknown error during translation';
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.toString()
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});