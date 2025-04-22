const fs = require("fs");
require("dotenv").config();

const config = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
};

fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
console.log("Config file created successfully. ");
