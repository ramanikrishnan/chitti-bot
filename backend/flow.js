console.log("FLOW FILE LOADED");

const axios = require("axios");

const sessions = {};

async function sendMessage(to, text) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: text,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Message sent:", response.data);
  } catch (error) {
    console.log(
      "Send message error:",
      JSON.stringify(error.response?.data || error.message, null, 2)
    );
  }
}

async function handleMessage(phone, message) {
  console.log("Incoming:", phone, message);

  message = message.trim().toLowerCase();

  if (!sessions[phone] || message === "hi") {
    sessions[phone] = {
      step: "ASK_SERVICE",
    };

    return sendMessage(
      phone,
      "Welcome 👋\n\nChoose service:\n1. Appointment\n2. Consultation\n3. Support"
    );
  }
}

module.exports = { handleMessage };
