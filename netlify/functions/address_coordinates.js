const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const { address } = event.queryStringParameters;
    const key = process.env.GOOGLE_API_KEY;

    console.log(`Fetching geocode for address: ${address}`);

    const firstResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: { address, key },
      }
    );
    const firstData = firstResponse.data;

    console.log('First geocoding API response:', firstData);

    if (firstData.status !== 'OK' || firstData.results.length === 0) {
      console.error('No results or error status from first geocode:', firstData.status);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'No results found for the provided address.' }),
      };
    }

    const primaryResult = firstData.results[0];
    const exactLocation = primaryResult.geometry.location; 

    let cityResult = null;
    for (const result of firstData.results) {
      if (result.types.includes('locality')) {
        cityResult = result;
        break;
      }
    }

    if (cityResult) {
      const cityPlaceId = cityResult.place_id;
      console.log('Found city-level placeId in the FIRST response:', cityPlaceId);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          lat: exactLocation.lat,
          lng: exactLocation.lng,
          placeId: cityPlaceId,
        }),
      };
    }

    let cityName = null;
    let countryName = null;

    for (const comp of primaryResult.address_components) {
      if (comp.types.includes('locality')) {
        cityName = comp.long_name;
      }
      if (comp.types.includes('country')) {
        countryName = comp.long_name;
      }
    }

    if (!cityName) {
      console.warn('No "locality" found in the address components. Returning just lat/lng.');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          lat: exactLocation.lat,
          lng: exactLocation.lng,
          placeId: null,
        }),
      };
    }

    if (!countryName) {
      console.warn('No "country" found in address_components. Using only city name for second call.');
    }

    const cityQuery = countryName ? `${cityName}, ${countryName}` : cityName;
    console.log('Second geocoding call with cityQuery =', cityQuery);

    const secondResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: { address: cityQuery, key },
      }
    );
    const secondData = secondResponse.data;

    console.log('Second geocoding API response:', secondData);

    if (secondData.status !== 'OK' || secondData.results.length === 0) {
      console.warn('No results for the city-only fallback call. Returning lat/lng without city placeId.');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          lat: exactLocation.lat,
          lng: exactLocation.lng,
          placeId: null,
        }),
      };
    }

    let cityPlaceId = null;
    for (const result of secondData.results) {
      if (result.types.includes('locality')) {
        cityPlaceId = result.place_id;
        break;
      }
    }

    console.log('City-level placeId from SECOND call:', cityPlaceId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        lat: exactLocation.lat,
        lng: exactLocation.lng,
        placeId: cityPlaceId ?? null,
      }),
    };
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
