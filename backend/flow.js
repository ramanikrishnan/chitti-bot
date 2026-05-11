const axios = require("axios");
const { saveBooking } = require("./sheets");

const sessions = {};

async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
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
}

async function handleMessage(phone, message) {
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

  const user = sessions[phone];

  if (user.step === "ASK_SERVICE") {
    if (message === "1") user.service = "Appointment";
    else if (message === "2") user.service = "Consultation";
    else if (message === "3") user.service = "Support";
    else return sendMessage(phone, "Please choose 1, 2, or 3.");

    user.step = "ASK_NAME";
    return sendMessage(phone, "Enter your name:");
  }

  if (user.step === "ASK_NAME") {
    user.name = message;
    user.step = "ASK_DATE";
    return sendMessage(phone, "Enter appointment date:");
  }

  if (user.step === "ASK_DATE") {
    user.date = message;
    user.step = "ASK_TIME";
    return sendMessage(phone, "Enter appointment time:");
  }

  if (user.step === "ASK_TIME") {
    user.time = message;
    user.step = "CONFIRM";

    return sendMessage(
      phone,
      `Confirm your booking:\n\nName: ${user.name}\nService: ${user.service}\nDate: ${user.date}\nTime: ${user.time}\n\nReply YES to confirm or NO to cancel.`
    );
  }

  if (user.step === "CONFIRM") {
    if (message === "yes") {
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

    if (message === "no") {
      delete sessions[phone];
      return sendMessage(phone, "Booking cancelled. Send hi to start again.");
    }

    return sendMessage(phone, "Please reply YES or NO.");
  }
}

module.exports = { handleMessage };
