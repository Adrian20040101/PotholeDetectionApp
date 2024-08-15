const { exec } = require('child_process');
const fetch = require('node-fetch');
const pythonScriptPath = "C:/Users/oinac/OneDrive/Desktop/personal_projects/pothole-detection/Pothole-model2/predict-photos.py";

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'This was a preflight call!',
    };
  }

  const { imageUrl } = JSON.parse(event.body);

  console.log(`Image uploaded: ${imageUrl}`);

  return new Promise((resolve, reject) => {
    exec(`python3 ${pythonScriptPath} "${imageUrl}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return reject({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: `Error: ${error.message}` }),
        });
      }
      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
        return reject({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: `Error: ${stderr}` }),
        });
      }
      console.log(`Python stdout: ${stdout}`);
      resolve({
        statusCode: 200,
        headers,
        body: JSON.stringify({ result: stdout }),
      });
    });
  });
};
