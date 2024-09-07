const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight check.' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const idToken = body.idToken;

    if (!idToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'ID token is required.' }),
      };
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Token:', decodedToken);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'ID token verified successfully.',
        decodedToken,
      }),
    };
  } catch (error) {
    console.error('Error verifying ID token:', error);

    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        message: 'Token verification failed.',
        error: error.message,
      }),
    };
  }
};
