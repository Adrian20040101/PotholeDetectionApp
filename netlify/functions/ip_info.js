const axios = require('axios');

exports.handler = async function (event, context) {
  try {
    const key = process.env.EXPO_PUBLIC_IP_API_KEY;
    const response = await axios.get('https://ipinfo.io/json', {
      params: {
        token: key,
      },
    });

    const data = response.data;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch location' }),
    };
  }
};
