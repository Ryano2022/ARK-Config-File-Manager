async function checkGameini() {
  // Wait for it to check uploads. 
  const files = await window.electronAPI.checkForUploads();
  // Get the sections ready. 
  const fileStatus = document.getElementById('fileStatus');
  const uploadSection = document.getElementById('uploadSection');
  
  // Check if Game.ini exists.
  if (files == "Zero" || !files.includes('Game.ini') || !files.includes('game.ini')) {
    fileStatus.innerHTML = "<h2>No Game.ini file found.</h2>";
    uploadSection.style.display = 'block';
  } 
  else { 
    fileStatus.innerHTML = "<h2>Game.ini file found.</h2>";
    uploadSection.style.display = 'none';
  }
}

// Check for Game.ini when page loads.
window.addEventListener('DOMContentLoaded', checkGameini);

// Upload the selected file.
async function uploadSelected() {
  const fileInput = document.getElementById('fileInput');
  const fileStatus = document.getElementById('fileStatus');
  const uploadSection = document.getElementById('uploadSection');

  // Check if a file was selected and only one file
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("No file selected.");
    return;
  }
  if (fileInput.files.length > 1) {
    alert("Please select only one file.");
    return;
  }

  const file = fileInput.files[0];
  
  // Read file content
  const fileContent = await file.text();
  
  // Prepare file object with required properties
  const fileData = {
    name: file.name,
    data: fileContent
  };

  // Upload the file with proper data
  const result = await window.electronAPI.uploadFile(fileData);
  if (result == "Success") {
    alert("File uploaded successfully.");
    uploadSection.style.display = 'none';
    fileStatus.innerHTML = "<h2>Game.ini file found.</h2>";
    fileStatus.style.display = 'none';
  } 
  else {
    alert("Error uploading file.\n\n" + result);
  }
}