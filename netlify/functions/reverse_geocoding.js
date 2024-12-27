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

    let cityPlaceId = null;
    let county = null;
    let region = null;

    for (const result of data.results) {
      if (result.types.includes('locality')) {
        cityPlaceId = result.place_id;

        for (const component of result.address_components) {
          if (component.types.includes('administrative_area_level_2')) {
            county = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            region = component.long_name;
          }
        }
        break;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ region, county, placeId: cityPlaceId }),
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
