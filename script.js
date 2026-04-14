const year = document.getElementById("year");
const bookingDateInput = document.querySelector('#bookingForm input[name="date"]');

const bookingContent = {
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

const profileContent = {
  mk: {
    sending: "Вашите податоци се зачувуваат...",
    success(petName) {
      return `Благодариме! Податоците за ${petName} се успешно зачувани и ќе можеме полесно да ве контактираме.`;
    },
    error: "Настана проблем при зачувувањето. Обидете се повторно.",
    buttonIdle: "Зачувај контакт",
    buttonBusy: "Се зачувува...",
  },
  en: {
    sending: "Saving your information...",
    success(petName) {
      return `Thank you! ${petName}'s contact details have been saved successfully.`;
    },
    error: "Something went wrong while saving your information. Please try again.",
    buttonIdle: "Save contact details",
    buttonBusy: "Saving...",
  },
};

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMinimumDate(input) {
  if (input) {
    input.min = new Date().toISOString().split("T")[0];
  }
}

async function submitJson(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result = {};

  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Request failed");
  }

  return result;
}

function bindForm({
  formId,
  messageId,
  endpoint,
  contentMap,
  onSuccessMessage,
  afterReset,
}) {
  const form = document.getElementById(formId);
  const message = document.getElementById(messageId);

  if (!form || !message) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const language = form.dataset.lang === "en" ? "en" : "mk";
  const text = contentMap[language];

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
      const result = await submitJson(endpoint, payload);
      message.textContent = onSuccessMessage(result, text);
      form.reset();

      if (afterReset) {
        afterReset(form);
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

setMinimumDate(bookingDateInput);

bindForm({
  formId: "bookingForm",
  messageId: "formMessage",
  endpoint: "/api/bookings",
  contentMap: bookingContent,
  onSuccessMessage(result, text) {
    return text.success(
      result.booking.reference,
      Boolean(result.booking.emailSent),
    );
  },
  afterReset() {
    setMinimumDate(bookingDateInput);
  },
});

bindForm({
  formId: "petProfileForm",
  messageId: "profileMessage",
  endpoint: "/api/pet-profiles",
  contentMap: profileContent,
  onSuccessMessage(result, text) {
    return text.success(result.profile.petName);
  },
});
