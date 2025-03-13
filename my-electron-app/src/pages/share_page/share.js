let shareButton, publicFilesButton, myFilesButton, uploadSection, uploadButton, fileList, user;

document.addEventListener("DOMContentLoaded", async () => {
  shareButton = document.getElementById("shareFile");
  publicFilesButton = document.getElementById("publicFiles");
  myFilesButton = document.getElementById("myFiles");
  uploadSection = document.getElementById("uploadSection");
  uploadButton = document.getElementById("uploadButton");
  fileList = document.getElementById("fileList");

  // Initialize user state immediately
  user = await window.electronAPI.getCurrentUser();

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
    uploadButton.addEventListener("click", uploadFile);
  }

  fileList.addEventListener("click", (e) => {
    if (e.target.matches(".delete-button")) {
      const fileId = e.target.dataset.fileId;
      if (confirm("Are you sure you want to delete this file?")) removeFileFromList(fileId);
    }
  });

  setButtonState("publicFiles");
  populateFileList();
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
    const currentUser = await window.electronAPI.getCurrentUser();
    if (!currentUser) {
      console.log("No logged in user. ");
      window.location.href = "../account_page/account.html?from=share";
      return;
    }
    user = currentUser;
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
    await populateFileList();
  } else if (mode == "myFiles") {
    console.log("Switched to my files mode. ");
    await populateFileList(user);
  } else {
    console.error("Invalid mode. ");
  }
}

function getUsername(email) {
  if (!email) return "Unknown";
  return email.split("@")[0];
}

async function userIsLoggedIn() {
  try {
    const currentUser = await window.electronAPI.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      console.log("No valid user found. ");
      window.location.href = "../account_page/account.html";
      return null;
    }
    const username = getUsername(currentUser.email);
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

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const descriptionShort = document.getElementById("descriptionShort").value;
  const descriptionLong = document.getElementById("descriptionLong").value;

  if (!fileInput || !fileInput.files[0] || !descriptionShort) {
    console.error("Missing required fields. ");
    return;
  }

  const file = fileInput.files[0];
  const fileContent = await file.text();
  const timestamp = new Date().toISOString();

  const fileData = {
    name: file.name,
    descriptionShort: descriptionShort,
    descriptionLong: descriptionLong,
    content: fileContent,
    uploadedBy: user,
    uploadedAt: timestamp,
  };

  try {
    console.log("Uploading file to Firestore: ", fileData.name);
    const result = await window.electronAPI.addFileToFirestore(fileData);
    console.log("Upload result: ", result);
    if (result.success) {
      fileInput.value = "";
      document.getElementById("descriptionShort").value = "";
      document.getElementById("descriptionLong").value = "";
      switchViewMode("myFiles");
    } else {
      if (result.error.includes("permission-denied")) {
        console.error("Permission denied: You don't have access to upload files. ");
      } else {
        console.error("Error uploading file: ", result.error);
      }
    }
  } catch (error) {
    console.error("Upload error: ", error);
  }
}

function canModifyFile(file) {
  if (!user || !file.uploadedBy) return false;
  return user.uid === file.uploadedBy.uid;
}

async function addFileToList(file) {
  if (!file || !fileList) return;

  const fileElement = document.createElement("div");
  const isCurrentUser = user && file.uploadedBy?.email == user.email;
  fileElement.className = `file-item ${isCurrentUser ? "current-user-file" : ""}`;
  const username = getUsername(file.uploadedBy?.email);
  const deleteButton = canModifyFile(file)
    ? `<button class="delete-button" data-file-id="${file.id}">Delete</button>`
    : "";
  const userClass = isCurrentUser ? "current-user" : "";

  fileElement.innerHTML = `
    <div class="file-header">
      <h3>${file.name || "Unknown File"}</h3>
      <span class="uploaded-by ${userClass}">Uploaded by: ${username || "Unknown"}</span>
    </div>
    <p class="description-short">${file.descriptionShort || "No description provided."}</p>
    ${file.descriptionLong ? `<p class="description-long">${file.descriptionLong}</p>` : ""}
    <div class="delete-container">
      ${deleteButton}
    </div>
  `;
  fileList.appendChild(fileElement);
}

async function removeFileFromList(fileId) {
  try {
    console.log("Attempting to remove file: ", fileId);
    const files = await window.electronAPI.retrieveFilesFromFirestore({ id: fileId });
    console.log("File check result:", files);

    const file = files[0];

    if (!file || !canModifyFile(file)) {
      console.error("Permission denied: Cannot delete this file. ");
      return;
    }

    const result = await window.electronAPI.removeFileFromFirestore(fileId);
    console.log("Remove result:", result);
    if (result.success) {
      const fileElement = document.querySelector(`.file-item:has(button[data-file-id="${fileId}"])`);
      if (fileElement) {
        fileElement.remove();
      }
    } else {
      if (result.error.includes("permission-denied")) {
        console.error("Permission denied: You don't have permission to delete this file. ");
      } else {
        console.error("Error removing file:", result.error);
      }
    }
  } catch (error) {
    console.error("Remove error: ", error);
  }
}

async function populateFileList(userFilter = null) {
  if (!fileList) return;

  fileList.innerHTML = "";

  try {
    console.log("Retrieving files with filter:", userFilter);
    const result = await window.electronAPI.retrieveFilesFromFirestore(userFilter);
    console.log("Retrieved files:", result);
    if (Array.isArray(result)) {
      // Sort files: null uploadedAt first, then by date descending
      const sortedFiles = result.sort((a, b) => {
        if (!a.uploadedAt) return -1;
        if (!b.uploadedAt) return 1;
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      });
      sortedFiles.forEach((file) => addFileToList(file));
    } else if (result.error && result.error.includes("permission-denied")) {
      console.error("Permission denied: Cannot access file list. ");
    }
  } catch (error) {
    console.error("Populate error: ", error);
  }
}
