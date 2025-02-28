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

function getUsername(email) {
  return email.split("@")[0];
}

function setLoginState(isLoggedIn, user) {
  if (isLoggedIn == true && user && user.email) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", user.email);
  } else {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const currentEmail = document.getElementById("currentUserEmail");
  const userEmailNavbar = document.getElementById("userEmailNavbar");

  const isLoggedIn = localStorage.getItem("isLoggedIn") == "true";
  const savedEmail = localStorage.getItem("userEmail");
  if (isLoggedIn && savedEmail) {
    console.log("Found stored login, updating UI immediately...");
    currentEmail.textContent = savedEmail;
    userEmailNavbar.textContent = getUsername(savedEmail);
    updateUIState(true);
  }

  window.electronAPI
    .getCurrentUser()
    .then((user) => {
      if (user) {
        console.log("Firebase auth confirmed user, updating UI...");
        currentEmail.textContent = user.email;
        userEmailNavbar.textContent = getUsername(user.email);
        updateUIState(true);
        setLoginState(true, user);
      } else {
        console.log("No Firebase user found, clearing any stored login...");
        currentEmail.textContent = "";
        userEmailNavbar.textContent = "Account";
        updateUIState(false);
        setLoginState(false, null);
      }
    })
    .catch((error) => {
      console.error("Error checking current user:", error);
      if (!isLoggedIn) {
        updateUIState(false);
      }
    });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const user = await window.electronAPI.signInWithEmail(email, password);

      // Successfully signed in.
      updateUIState(true);
      alert("User signed in successfully. ");
      console.log("User signed in successfully. ");
      currentEmail.textContent = user.email;
      userEmailNavbar.textContent = getUsername(user.email);
      errorMessage.style.display = "none";
      setLoginState(true, user);
    } catch (error) {
      // Error signing in.
      console.error("Error signing in: " + error.message);
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
      setLoginState(false, null);
    }
  });

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await window.electronAPI.signOut();
    updateUIState(false);
    currentEmail.textContent = "";
    userEmailNavbar.textContent = "Account";
    setLoginState(false, null);
  });

  document.getElementById("registerButton").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const user = await window.electronAPI.registerWithEmail(email, password);
      currentEmail.textContent = user.email;
      userEmailNavbar.textContent = getUsername(user.email);

      // Successfully registered.
      updateUIState(true);
      alert("User registered successfully. ");
      console.log("User registered successfully. ");
      setLoginState(true, user);
    } catch (error) {
      // Error registering in.
      console.error("Error registering: " + error.message);
      errorMessage.textContent = error.message;
      errorMessage.style.display = "block";
      setLoginState(false, null);
    }
  });
});
