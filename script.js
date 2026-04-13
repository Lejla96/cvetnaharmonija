const form = document.getElementById("bookingForm");
const message = document.getElementById("formMessage");
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (form && message) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name");
    const petType = formData.get("petType") === "dog" ? "куче" : "мачка";
    const date = formData.get("date");

    message.textContent = `Благодариме, ${name}! Вашето барање за термин за ${petType} на ${date} е испратено. Ќе ве контактираме наскоро.`;
    form.reset();
  });
}
