function updateUIState(isLoggedIn) {
  const currentUserDiv = document.querySelector(".currentUser");
  const loginForm = document.getElementById("loginForm");

  if (isLoggedIn) {
    currentUserDiv.style.display = "block";
    currentUserDiv.classList.add("visible");
    loginForm.style.display = "none";
  } else {
    currentUserDiv.style.display = "none";
    currentUserDiv.classList.remove("visible");
    loginForm.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const currentEmail = document.getElementById("currentUserEmail");

  window.electronAPI.getCurrentUser().then((user) => {
    if (user) {
      console.log("Found user, updating UI...");
      currentEmail.textContent = user.email;
      updateUIState(true);
    } else {
      console.log("No user found, showing login form...");
      updateUIState(false);
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const user = await window.electronAPI.signInWithEmail(email, password);
      currentEmail.textContent = user.email;

      // Successfully signed in.
      updateUIState(true);
      alert("User signed in successfully. ");
      console.log("User signed in successfully. ");
    } catch (error) {
      // Error signing in.
      console.error("Error signing in: " + error.message);
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
    }
  });

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await window.electronAPI.signOut();
    updateUIState(false);
    currentEmail.textContent = "";
  });
});
