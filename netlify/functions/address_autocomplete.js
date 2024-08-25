const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const { input } = event.queryStringParameters;
    const key = process.env.GOOGLE_API_KEY;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input,
          key,
          types: 'geocode', // focuses on returning addresses
        },
      }
    );

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.data.predictions),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
