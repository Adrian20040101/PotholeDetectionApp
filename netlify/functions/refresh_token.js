const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    try {
        const { refreshToken } = JSON.parse(event.body);

        const key = process.env.GOOGLE_API_KEY;

        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ idToken: data.id_token }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
