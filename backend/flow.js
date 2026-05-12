console.log("FLOW FILE LOADED");

const axios = require("axios");
const { saveBooking } = require("./sheets");

const sessions = {};

async function sendMessage(to, text) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text },
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

  const text = message.trim().toLowerCase();

  // Start or restart session on any message if no session exists
  if (!sessions[phone] || text === "hi" || text === "hello") {
    sessions[phone] = { step: "ASK_SERVICE" };
    return sendMessage(
      phone,
      "Welcome 👋\n\nChoose service:\n1. Appointment\n2. Consultation\n3. Support"
    );
  }

  const user = sessions[phone];

  if (user.step === "ASK_SERVICE") {
    if (text === "1") user.service = "Appointment";
    else if (text === "2") user.service = "Consultation";
    else if (text === "3") user.service = "Support";
    else return sendMessage(phone, "Please choose 1, 2, or 3.");

    user.step = "ASK_NAME";
    return sendMessage(phone, "Enter your name:");
  }

  if (user.step === "ASK_NAME") {
    user.name = message.trim();
    user.step = "ASK_DATE";
    return sendMessage(phone, "Enter appointment date (e.g. 25 July 2025):");
  }

  if (user.step === "ASK_DATE") {
    user.date = message.trim();
    user.step = "ASK_TIME";
    return sendMessage(phone, "Enter appointment time (e.g. 10:00 AM):");
  }

  if (user.step === "ASK_TIME") {
    user.time = message.trim();
    user.step = "CONFIRM";
    return sendMessage(
      phone,
      `Confirm your booking:\n\nName: ${user.name}\nService: ${user.service}\nDate: ${user.date}\nTime: ${user.time}\n\nReply YES to confirm or NO to cancel.`
    );
  }

  if (user.step === "CONFIRM") {
    if (text === "yes") {
      await saveBooking({
        bookingId: Date.now(),
        createdAt: new Date().toLocaleString(),
        name: user.name,
        phone,
        service: user.service,
        date: user.date,
        time: user.time,
        status: "Pending",
      });
      delete sessions[phone];
      return sendMessage(phone, "✅ Booking confirmed. Thank you!");
    }

    if (text === "no") {
      delete sessions[phone];
      return sendMessage(phone, "Booking cancelled. Send any message to start again.");
    }

    return sendMessage(phone, "Please reply YES or NO.");
  }
}

module.exports = { handleMessage };
