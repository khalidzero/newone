const https = require('https');

// Main serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Méthode non autorisée. Utilisez POST.'
    });
  }
  
  try {
    const { videoUrl } = req.body;
    
    // Validate the videoUrl
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'URL de vidéo non fournie'
      });
    }
    
    if (!isValidFacebookUrl(videoUrl)) {
      return res.status(400).json({
        success: false,
        error: 'L\'URL ne semble pas être une URL Facebook valide'
      });
    }
    
    // Call RapidAPI to get download links
    const rapidApiData = await callRapidApi(videoUrl);
    
    // Return the data to frontend
    return res.status(200).json({
      success: true,
      data: rapidApiData
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return res.status(500).json({
      success: false,
      error: `Erreur lors du traitement de la demande: ${error.message || 'Erreur inconnue'}`
    });
  }
};

// Helper function to validate Facebook URLs
function isValidFacebookUrl(url) {
  return url.includes('facebook.com/') || 
         url.includes('fb.com/') || 
         url.includes('fb.watch/') ||
         url.includes('m.facebook.com/');
}

// Function to call the RapidAPI endpoint
function callRapidApi(videoUrl) {
  return new Promise((resolve, reject) => {
    // RapidAPI endpoint details
    const options = {
      method: 'POST',
      hostname: 'auto-download-all-in-one.p.rapidapi.com',
      path: '/v1/social/autolink',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '0fcffbe5d7msh537fd85c78b692fp1b4099jsnd561354f3ac7',
        'X-RapidAPI-Host': 'auto-download-all-in-one.p.rapidapi.com'
      }
    };
    
    const req = https.request(options, (response) => {
      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        const body = Buffer.concat(chunks);
        
        // Check if the response status is successful
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            // Parse the JSON response
            const jsonResponse = JSON.parse(body.toString());
            resolve(jsonResponse);
          } catch (error) {
            reject(new Error('Erreur lors de l\'analyse de la réponse de l\'API'));
          }
        } else {
          // Handle API error response
          try {
            const errorResponse = JSON.parse(body.toString());
            reject(new Error(errorResponse.message || `L'API a retourné une erreur: ${response.statusCode}`));
          } catch (err) {
            reject(new Error(`L'API a retourné une erreur: ${response.statusCode}`));
          }
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Erreur de connexion à l'API: ${error.message}`));
    });
    
    // Send the request with the video URL
    const postData = JSON.stringify({
      url: videoUrl
    });
    
    req.write(postData);
    req.end();
  });
}