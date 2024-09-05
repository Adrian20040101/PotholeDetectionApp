const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    try {
        const { refreshToken } = JSON.parse(event.body);

        const key = process.env.GOOGLE_API_KEY;

        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
        });

        const responseBody = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to refresh token: ${responseBody}`);
        }

        const data = JSON.parse(responseBody);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ idToken: data.id_token }),
        };
    } catch (error) {
        console.error('Error in refresh_token function:', error);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

