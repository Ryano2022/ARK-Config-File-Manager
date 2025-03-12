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

export function getUsername(email) {
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
  const registerForm = document.getElementById("registerForm");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
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

  errorMessage.addEventListener("click", () => {
    errorMessage.style.display = "none";
  });

  successMessage.addEventListener("click", () => {
    successMessage.style.display = "none";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (email && password) {
      try {
        const user = await window.electronAPI.signInWithEmail(email, password);

        // Successfully signed in.
        updateUIState(true);
        successMessage.textContent = "User signed in successfully.";
        successMessage.style.display = "block";
        console.log("User signed in successfully. ");
        currentEmail.textContent = user.email;
        userEmailNavbar.textContent = getUsername(user.email);
        errorMessage.style.display = "none";
        setLoginState(true, user);
      } catch (error) {
        // Error signing in.
        console.error("Error signing in: " + error.message);
        successMessage.style.display = "none";
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
        setLoginState(false, null);
      }
    } else {
      errorMessage.textContent = "Please enter an email and password. ";
      errorMessage.style.display = "block";
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const passwordConfirm = document.getElementById("registerPasswordConfirm").value;

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      errorMessage.textContent = "Please enter a valid email address. ";
      errorMessage.style.display = "block";
      return;
    }

    // Make sure the password and confirm match.
    if (password != passwordConfirm) {
      errorMessage.textContent = "Passwords do not match. ";
      errorMessage.style.display = "block";
      return;
    }

    if (email && password) {
      try {
        const user = await window.electronAPI.registerWithEmail(email, password);
        updateUIState(true);
        successMessage.textContent = "Account created successfully!";
        successMessage.style.display = "block";
        console.log("User registered successfully. ");
        currentEmail.textContent = user.email;
        userEmailNavbar.textContent = getUsername(user.email);
        errorMessage.style.display = "none";
        registerForm.style.display = "none";
        setLoginState(true, user);
      } catch (error) {
        console.error("Error creating account: " + error.message);
        successMessage.style.display = "none";
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
      }
    } else {
      errorMessage.textContent = "Please enter an email and password. ";
      errorMessage.style.display = "block";
    }
  });

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await window.electronAPI.signOut();
    updateUIState(false);
    currentEmail.textContent = "";
    userEmailNavbar.textContent = "Account";
    setLoginState(false, null);
    successMessage.style.display = "none";
  });

  // Handle switching between login and register forms.
  document.getElementById("switchToRegister").addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    errorMessage.style.display = "none";
    successMessage.style.display = "none";
  });

  document.getElementById("switchToLogin").addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    errorMessage.style.display = "none";
    successMessage.style.display = "none";
  });
});
