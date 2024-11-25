const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const { city } = event.queryStringParameters;
    const key = process.env.GOOGLE_API_KEY;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: city,
          key,
        },
      }
    );

    console.log('Geocoding API response:', response.data);

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      const bounds = result.geometry.viewport;
      
      console.log('Location found:', location);
      console.log('Bounds found:', bounds);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          bounds: bounds ? {
            northeast: bounds.northeast,
            southwest: bounds.southwest,
          } : null,
        }),
      };
    } else {
      console.error('Error: No results found or other issue:', response.data.status);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'No results found for the provided address.' }),
      };
    }
  } catch (error) {
    console.error(`Error in geocoding function: ${error.message}`);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
