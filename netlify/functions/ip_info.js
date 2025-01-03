const axios = require('axios');

exports.handler = async (event, context) => {
  const allowedOrigins = [
    'http://localhost:8081',
    'https://road-guard.netlify.app', 
  ];

  const setCorsHeaders = (origin) => {
    if (allowedOrigins.includes(origin)) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      };
    }
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };
  };

  const origin = event.headers.origin;

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: setCorsHeaders(origin),
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: setCorsHeaders(origin),
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const key = process.env.EXPO_PUBLIC_IP_API_KEY;

    const userIP =
      event.headers['x-forwarded-for'] ||
      event.headers['client-ip'] ||
      '127.0.0.1';

    console.log(`Fetching geolocation for IP: ${userIP}`);

    const response = await axios.get(`https://ipinfo.io/${userIP}/json`, {
      params: {
        token: key,
      },
    });

    const data = response.data;

    if (!data.loc) {
      console.error('Location data not available');
      return {
        statusCode: 404,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Location data not available' }),
      };
    }

    const [lat, lng] = data.loc.split(','); // loc is "lat,lng"

    console.log('Extracted location:', lat, lng);

    return {
      statusCode: 200,
      headers: setCorsHeaders(origin),
      body: JSON.stringify({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        city: data.city || null,
        region: data.region || null,
        country: data.country || null,
      }),
    };
  } catch (error) {
    console.error('Error fetching location:', error.message);
    return {
      statusCode: 500,
      headers: setCorsHeaders(origin),
      body: JSON.stringify({ error: 'Failed to fetch location' }),
    };
  }
};
