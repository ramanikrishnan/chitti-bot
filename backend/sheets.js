const axios = require("axios");

async function saveBooking(data) {
  if (!process.env.GOOGLE_SCRIPT_URL) {
    console.log("Google Sheet URL not added yet. Booking data:", data);
    return;
  }

  await axios.post(process.env.GOOGLE_SCRIPT_URL, data);
}

module.exports = { saveBooking };
