const axios = require('axios');

const setCorsHeaders = (origin) => {
  const allowedOrigins = [
    'http://localhost:8081',
    'https://road-guard.netlify.app',
  ];

  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };
  }
  return {
    'Access-Control-Allow-Origin': 'https://road-guard.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
};

exports.handler = async (event, context) => {
  const origin = event.headers.origin;

  console.log('Request Headers:', event.headers);

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

    if (!key) {
      console.error('API key is not set.');
      return {
        statusCode: 500,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ error: 'Server configuration error.' }),
      };
    }

    const extractIP = () => {
      const headers = event.headers;

      if (headers['x-nf-client-connection-ip']) {
        return headers['x-nf-client-connection-ip'];
      }

      if (headers['x-forwarded-for']) {
        const ips = headers['x-forwarded-for'].split(',').map(ip => ip.trim());
        for (const ip of ips) {
          if (validator.isIP(ip)) {
            return ip;
          }
        }
      }

      if (headers['client-ip']) {
        return headers['client-ip'];
      }

      if (headers['x-real-ip']) {
        return headers['x-real-ip'];
      }

      return null;
    };

    let userIP = extractIP();

    if (!userIP) {
      console.warn('Unable to determine client IP.');
      return {
        statusCode: 400,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Unable to determine client IP.' }),
      };
    }

    console.log(`Determined client IP: ${userIP}`);

    if (userIP === '127.0.0.1' || userIP === '::1') {
      console.warn('Cannot geolocate localhost IP.');
      return {
        statusCode: 400,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Cannot geolocate localhost IP.' }),
      };
    }

    const response = await axios.get(`https://ipinfo.io/${userIP}/json?token=${key}`)

    const data = response.data;

    console.log('ipinfo.io response:', data);

    if (!data.loc) {
      console.error('Location data not available in ipinfo.io response.');
      return {
        statusCode: 404,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Location data not available.' }),
      };
    }

    const [lat, lng] = data.loc.split(','); // loc is "lat,lng"

    console.log(`Extracted location: Latitude=${lat}, Longitude=${lng}`);

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
      body: JSON.stringify({ error: 'Failed to fetch location.' }),
    };
  }
};
