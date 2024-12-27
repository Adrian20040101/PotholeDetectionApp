const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const { address } = event.queryStringParameters;
    const key = process.env.GOOGLE_API_KEY;

    console.log(`Fetching geocode for address: ${address}`);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address,
          key,
        },
      }
    );

    console.log('Geocoding API response:', response.data);

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      let location = null;
      let cityPlaceId = null;

      for (const result of response.data.results) {
        const addressComponents = result.address_components;

        for (const component of addressComponents) {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            location = result.geometry.location;
            cityPlaceId = result.place_id;
            break;
          }
        }

        if (cityPlaceId) break;
      }
      if (location && cityPlaceId) {
        console.log('City-level location found:', location, 'Place ID:', cityPlaceId);
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ lat: location.lat, lng: location.lng, placeId: cityPlaceId }),
        };
      }
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
