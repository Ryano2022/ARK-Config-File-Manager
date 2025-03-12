document.addEventListener("DOMContentLoaded", () => {
  const shareButton = document.getElementById("shareFile");
  const publicFilesButton = document.getElementById("publicFiles");
  const myFilesButton = document.getElementById("myFiles");
  const uploadSection = document.getElementById("uploadSection");
  const uploadButton = document.getElementById("uploadButton");
  const fileList = document.getElementById("fileList");

  shareButton
    ? shareButton.addEventListener("click", () => switchViewMode("upload"))
    : console.error("Share button not found in the DOM. ");

  publicFilesButton
    ? publicFilesButton.addEventListener("click", () => switchViewMode("publicFiles"))
    : console.error("My Files button not found in the DOM. ");

  myFilesButton
    ? myFilesButton.addEventListener("click", () => switchViewMode("myFiles"))
    : console.error("Public Files button not found in the DOM. ");

  uploadButton
    ? uploadButton.addEventListener("click", addFileToFirestore)
    : console.error("Upload button not found in the DOM. ");

  setButtonState("publicFiles");
});

// Function to set button states based on current section
function setButtonState(mode) {
  const shareButton = document.getElementById("shareFile");
  const publicFilesButton = document.getElementById("publicFiles");
  const myFilesButton = document.getElementById("myFiles");

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
function switchViewMode(mode) {
  console.log(`Switching view mode to: ${mode}`);
  const uploadSection = document.getElementById("uploadSection");
  const fileList = document.getElementById("fileList");

  if (!uploadSection || !fileList) {
    console.error("Upload section or file list not found. ");
    return;
  }

  // Show upload section only in upload mode, show file list in all other modes.
  const isUploadMode = mode == "upload";
  fileList.style.display = isUploadMode ? "none" : "block";
  uploadSection.style.display = isUploadMode ? "block" : "none";

  setButtonState(mode);

  if (mode == "myFiles") {
    console.log("Loading personal files...");
    retrieveFilesFromFirestore("myFiles");
  } else {
    console.log("Loading public files...");
    retrieveFilesFromFirestore();
  }
}

// Add a file to Firestore.
function addFileToFirestore(file) {}

// Remove a file from Firestore.
function removeFileFromFirestore(filename) {}

// Retrieve all the files from Firestore.
function retrieveFilesFromFirestore(filter) {}

// Add a file to the list of files.
function addFileToList(file) {}

// Remove a file from the list of files.
function removeFileFromList(filename) {}
