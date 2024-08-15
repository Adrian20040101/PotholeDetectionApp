const { PythonShell } = require('python-shell');
const path = require('path');

const pythonScriptPath = path.resolve(__dirname, "../../trained-model/predict-photos.py");

exports.handler = async function (event, context) {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Bad Request: No body provided' }),
    };
  }

  let imageUrl;
  try {
    const body = JSON.parse(event.body);
    imageUrl = body.imageUrl;
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Bad Request: Invalid JSON' }),
    };
  }

  if (!imageUrl) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Bad Request: imageUrl is required' }),
    };
  }

  console.log(`Image uploaded: ${imageUrl}`);

  return new Promise((resolve, reject) => {
    const options = {
      args: [imageUrl],
    };

    PythonShell.run(pythonScriptPath, options, function (err, results) {
      if (err) {
        console.error(`Error executing Python script: ${err.message}`);
        return reject({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: `Error: ${err.message}` }),
        });
      }

      console.log(`Python script results: ${results}`);

      resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: results.join('\n') }),
      });
    });
  });
};
