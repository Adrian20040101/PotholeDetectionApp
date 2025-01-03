const axios = require('axios');

// helper function to validate IP addresses
const isValidIP = (ip) => {
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

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

    const { ip } = event.queryStringParameters || {};

    if (ip && !isValidIP(ip)) {
      console.warn('Invalid IP address provided.');
      return {
        statusCode: 400,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Invalid IP address provided.' }),
      };
    }

    let userIP = ip || (
      event.headers['x-nf-client-connection-ip'] ||
      event.headers['x-forwarded-for'] ||
      event.headers['client-ip'] ||
      '127.0.0.1'
    );

    if (userIP.includes(',')) {
      userIP = userIP.split(',')[0].trim();
    }

    console.log(`Fetching geolocation for IP: ${userIP}`);

    if (userIP === '127.0.0.1' || userIP === '::1') {
      console.warn('Cannot geolocate localhost IP.');
      return {
        statusCode: 400,
        headers: setCorsHeaders(origin),
        body: JSON.stringify({ message: 'Cannot geolocate localhost IP.' }),
      };
    }

    const response = await axios.get(`https://ipinfo.io/${userIP}/json`, {
      params: {
        token: key,
      },
    });

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
