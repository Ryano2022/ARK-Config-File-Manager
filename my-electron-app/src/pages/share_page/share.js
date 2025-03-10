document.addEventListener("DOMContentLoaded", () => {
  const shareButton = document.getElementById("shareFile");
  const publicFilesButton = document.getElementById("publicFiles");
  const uploadSection = document.getElementById("uploadSection");
  const uploadButton = document.getElementById("uploadButton");
  const fileList = document.getElementById("fileList");

  shareButton
    ? shareButton.addEventListener("click", () => toggleUploadSection("upload"))
    : console.error("Share button not found in the DOM. ");

  publicFilesButton
    ? publicFilesButton.addEventListener("click", () => toggleUploadSection("files"))
    : console.error("My Files button not found in the DOM. ");

  uploadButton
    ? uploadButton.addEventListener("click", addFileToFirestore)
    : console.error("Upload button not found in the DOM. ");

  setButtonState("files");
});

// Function to set button states based on current section
function setButtonState(mode) {
  const shareButton = document.getElementById("shareFile");
  const publicFilesButton = document.getElementById("publicFiles");

  if (!shareButton || !publicFilesButton) {
    console.error("One or more navigation buttons not found. ");
    return;
  }

  mode == "upload"
    ? (shareButton.classList.add("button-disabled"), publicFilesButton.classList.remove("button-disabled"))
    : (shareButton.classList.remove("button-disabled"), publicFilesButton.classList.add("button-disabled"));
}

// Toggle the upload section.
function toggleUploadSection(mode) {
  const uploadSection = document.getElementById("uploadSection");
  const fileList = document.getElementById("fileList");

  if (!uploadSection || !fileList) {
    console.error("Upload section or file list not found. ");
    return;
  }

  const isUploadMode = mode == "upload";
  fileList.style.display = isUploadMode ? "none" : "block";
  uploadSection.style.display = isUploadMode ? "block" : "none";

  setButtonState(mode);
}

// Add a file to Firestore.
function addFileToFirestore() {}

// Remove a file from Firestore.
function removeFileFromFirestore() {}

// Retrieve all the files from Firestore.
function retrieveFilesFromFirestore() {}

// Add a file to the list of files.
function addFileToList() {}

// Remove a file from the list of files.
function removeFileFromList() {}
