async function checkGameini() {
  const files = await window.electronAPI.checkForUploads();
  const fileStatus = document.getElementById('fileStatus');
  const addFiles = document.getElementById('addFiles');
  
  // Case-insensitive check for Game.ini
  const hasGameini = Array.isArray(files) && files.some(file => 
    file.toLowerCase() == 'game.ini'
  );
  
  if (files == "Zero" || !hasGameini) {
    fileStatus.innerHTML = "<h2>No Game.ini file found.</h2>";
    addFiles.style.display = 'block';
  } 
  else { 
    fileStatus.innerHTML = "<h2>Game.ini file found.</h2>";
    fileStatus.style.display = 'none';
    addFiles.style.display = 'none';
    displayFileContent(files[0]);
  }
}

// Check for Game.ini when page loads.
window.addEventListener('DOMContentLoaded', checkGameini);

// Upload the selected file.
async function addSelectedFile() {
  const fileInput = document.getElementById('fileInput');
  const fileStatus = document.getElementById('fileStatus');
  const addFiles = document.getElementById('addFiles');

  // Check if a file was selected and only one file.
  if (!fileInput.files || fileInput.files.length == 0) {
    alert("No file selected.");
    return;
  }
  if (fileInput.files.length > 1) {
    alert("Please select only one file.");
    return;
  }

  const file = fileInput.files[0];
  const fileContent = await file.text();
  
  const fileData = {
    name: file.name,
    data: fileContent
  };

  // Add the file with proper data.
  const result = await window.electronAPI.addFile(fileData);
  if (result == "Success") {
    alert("Added file " + file.name + " successfully.");
    console.log("Added file " + file.name + " successfully.");
    addFiles.style.display = 'none';
    fileStatus.innerHTML = "<h2>Game.ini file found.</h2>";
    fileStatus.style.display = 'none';
    displayFileContent(fileData.name);
  } 
  else {
    alert("Error adding file.\n\n" + result);
    console.error("Error adding file: ", result);
  }
}

// Display the content of the Game.ini file. 
async function displayFileContent(filename) {
  const fileContents = document.getElementById('fileContent');
  const content = await window.electronAPI.readFile(filename);
  if (content) {
    fileContents.innerHTML = "<pre>" + content + "</pre>";
    fileContents.style.display = 'block';
  } 
  else {
    console.error("Could not read file content. ");
  }
}