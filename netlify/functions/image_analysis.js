const { PythonShell } = require('python-shell');
const pythonScriptPath = "C:/Users/oinac/OneDrive/Desktop/personal_projects/pothole-detection/Pothole-model2/predict-photos.py";

exports.handler = async function (event, context) {
  const { imageUrl } = JSON.parse(event.body);

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
