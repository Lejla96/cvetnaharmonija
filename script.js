const form = document.getElementById("bookingForm");
const message = document.getElementById("formMessage");
const year = document.getElementById("year");
const dateInput = document.querySelector('input[name="date"]');

const content = {
  mk: {
    sending: "Вашето барање се испраќа...",
    success(reference, emailSent) {
      const emailPart = emailSent
        ? " Потврдата е испратена и на email."
        : " Барањето е зачувано во системот и ќе ве контактираме наскоро.";
      return `Благодариме! Вашето барање е примено со број ${reference}.${emailPart}`;
    },
    error: "Настана проблем при испраќањето. Обидете се повторно.",
    buttonIdle: "Испрати барање за термин",
    buttonBusy: "Се испраќа...",
  },
  en: {
    sending: "Sending your appointment request...",
    success(reference, emailSent) {
      const emailPart = emailSent
        ? " A confirmation email has been sent as well."
        : " Your request has been safely stored and our team will contact you soon.";
      return `Thank you! Your booking request has been received under reference ${reference}.${emailPart}`;
    },
    error: "Something went wrong while sending your request. Please try again.",
    buttonIdle: "Send booking request",
    buttonBusy: "Sending...",
  },
};

if (year) {
  year.textContent = new Date().getFullYear();
}

if (dateInput) {
  dateInput.min = new Date().toISOString().split("T")[0];
}

if (form && message) {
  const submitButton = form.querySelector('button[type="submit"]');
  const language = form.dataset.lang === "en" ? "en" : "mk";
  const text = content[language];

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.language = language;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = text.buttonBusy;
    }

    message.textContent = text.sending;

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Request failed");
      }

      message.textContent = text.success(
        result.booking.reference,
        Boolean(result.booking.emailSent),
      );
      form.reset();
      if (dateInput) {
        dateInput.min = new Date().toISOString().split("T")[0];
      }
    } catch (error) {
      console.error(error);
      message.textContent = text.error;
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = text.buttonIdle;
      }
    }
  });
}
