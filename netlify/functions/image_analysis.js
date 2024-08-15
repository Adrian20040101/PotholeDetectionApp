const { exec } = require('child_process');
const fetch = require('node-fetch');
const pythonScriptPath = "C:/Users/oinac/OneDrive/Desktop/personal_projects/pothole-detection/Pothole-model2/predict-photos.py";

exports.handler = async function (event, context) {
  const { imageUrl } = JSON.parse(event.body);

  console.log(`Image uploaded: ${imageUrl}`);

  return new Promise((resolve, reject) => {
    exec(`python3 ${pythonScriptPath} "${imageUrl}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return reject({ statusCode: 500, body: `Error: ${error.message}` });
      }
      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
        return reject({ statusCode: 500, body: `Error: ${stderr}` });
      }
      console.log(`Python stdout: ${stdout}`);
      resolve({ statusCode: 200, body: stdout });
    });
  });
};
