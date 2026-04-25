const container = document.querySelector(".container");
const btnSignin = document.getElementById("btn-Sign-in");
const btnSignup = document.getElementById("btn-Sign-up");

btnSignin.addEventListener("click", () => {
  container.classList.remove("toggle");
});

btnSignup.addEventListener("click", () => {
  container.classList.add("toggle");
});










