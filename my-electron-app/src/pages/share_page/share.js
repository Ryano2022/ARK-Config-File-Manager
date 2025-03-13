let shareButton, publicFilesButton, myFilesButton, uploadSection, uploadButton, fileList, user;

document.addEventListener("DOMContentLoaded", async () => {
  shareButton = document.getElementById("shareFile");
  publicFilesButton = document.getElementById("publicFiles");
  myFilesButton = document.getElementById("myFiles");
  uploadSection = document.getElementById("uploadSection");
  uploadButton = document.getElementById("uploadButton");
  fileList = document.getElementById("fileList");

  console.log("Navigated to Share page. ");
  
  if (shareButton) {
    shareButton.addEventListener("click", () => switchViewMode("upload"));
  }
  if (publicFilesButton) {
    publicFilesButton.addEventListener("click", () => switchViewMode("publicFiles"));
  }
  if (myFilesButton) {
    myFilesButton.addEventListener("click", () => switchViewMode("myFiles"));
  }
  if (uploadButton) {
    uploadButton.addEventListener("click", addFileToFirestore);
  }

  setButtonState("publicFiles");
  // Load public files by default.
  retrieveFilesFromFirestore();
});

// Function to set button states based on current section.
function setButtonState(mode) {
  if (!shareButton || !publicFilesButton || !myFilesButton) {
    console.error("One or more navigation buttons not found. ");
    return;
  }

  shareButton.classList.remove("button-disabled");
  publicFilesButton.classList.remove("button-disabled");
  myFilesButton.classList.remove("button-disabled");

  // Set the appropriate button as disabled based on current mode.
  if (mode == "upload") {
    shareButton.classList.add("button-disabled");
  } else if (mode == "publicFiles") {
    publicFilesButton.classList.add("button-disabled");
  } else if (mode == "myFiles") {
    myFilesButton.classList.add("button-disabled");
  }
}

// Switch between different view modes (upload, public files, my files).
async function switchViewMode(mode) {
  if (!uploadSection || !fileList) {
    console.error("Required DOM elements not found. ");
    return;
  }

  if ((mode == "upload" || mode == "myFiles") && !user) {
    user = await userIsLoggedIn();
    if (!user) {
      console.log("No logged in user. ");
      window.location.href = "../account_page/account.html?from=share";
      return;
    }
  }

  console.log(`Switching view mode to: ${mode}`);

  // Show upload section only in upload mode, show file list in all other modes.
  const isUploadMode = mode == "upload";
  fileList.style.display = isUploadMode ? "none" : "block";
  uploadSection.style.display = isUploadMode ? "block" : "none";

  setButtonState(mode);

  if (mode == "upload") {
    console.log("Switched to upload mode. ");
  } else if (mode == "publicFiles") {
    console.log("Switched to public files mode. ");
    retrieveFilesFromFirestore();
  } else if (mode == "myFiles") {
    console.log("Switched to my files mode. ");
    retrieveFilesFromFirestore(user);
  } else {
    console.error("Invalid mode. ");
  }
}

function getUsername(email) {
  return email.split("@")[0];
}

async function userIsLoggedIn() {
  try {
    const currentUser = await window.electronAPI.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      console.log("No valid user found");
      return null;
    }
    const username = await getUsername(currentUser.email);
    if (!username) {
      console.log("Could not get username for: ", currentUser.email);
      return null;
    }
    console.log("User is logged in: ", username);
    return username;
  } catch (error) {
    console.error("Error checking if user is logged in: ", error);
    return null;
  }
}

// Add a file to Firestore.
async function addFileToFirestore(file) {
  if (!user) {
    user = await userIsLoggedIn();
  }

  if (!user) {
    console.log("No logged in user. ");
    window.location.href = "../account_page/account.html";
    return;
  }

  if (!file) {
    console.error("Error adding file to Firestore: Invalid file object provided. ");
    return;
  }
}

// Remove a file from Firestore.
function removeFileFromFirestore(filename) {
  if (!filename) {
    console.error("Error removing file from Firestore: No filename provided. ");
    return;
  }
}

// Retrieve all the files from Firestore.
function retrieveFilesFromFirestore(userFilter) {
  if (userFilter) {
    console.log("Retrieving files for user: " + userFilter);
  } else {
    console.log("Retrieving all files. ");
  }
}

// Add a file to the list of files.
function addFileToList(file) {
  if (!file) {
    console.error("Error adding file to list: Invalid file object provided. ");
    return;
  }
}

// Remove a file from the list of files.
function removeFileFromList(filename) {
  if (!filename) {
    console.error("Error removing file from list: No filename provided. ");
    return;
  }
}
