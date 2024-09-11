const axios = require('axios');

exports.handler = async function (event, context) {
  const { lat, lng } = event.queryStringParameters;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!lat || !lng) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Latitude and Longitude are required' }),
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    const response = await axios.get(url);

    const data = response.data;

    if (data.status !== 'OK') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ message: 'Failed to fetch geocoding data' }),
      };
    }

    const addressComponents = data.results[0].address_components;
    let county = null;
    let region = null;
    addressComponents.forEach((component) => {
      if (component.types.includes('administrative_area_level_2')) {
        county = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        region = component.long_name;
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ region, county }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
