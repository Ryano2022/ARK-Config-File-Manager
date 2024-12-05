async function checkGameini() {
  const files = await window.electronAPI.checkForAddedFiles();
  const fileStatus = document.getElementById('fileStatus');
  const addFiles = document.getElementById('addFiles');
  const styleButtons = document.getElementById('styleButtons');
  
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
    styleButtons.style.display = 'block';
    displayFileContent(files[0], "pretty");
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
    displayFileContent(fileData.name, "pretty");
  } 
  else {
    alert("Error adding file.\n\n" + result);
    console.error("Error adding file: ", result);
  }
}

// Display the content of the Game.ini file. 
async function displayFileContent(filename, type) {
  const fileContents = document.getElementById('fileContents');
  const viewPrettyBtn = document.getElementById('viewPretty');
  const viewRawBtn = document.getElementById('viewRaw');
  const content = await window.electronAPI.readFile(filename);

  if (content) {
    fileContents.style.display = 'block';

    if (type === "raw") {
      console.log("Displaying raw content.");
      viewRawBtn.disabled = true;
      viewPrettyBtn.disabled = false; 
      
      fileContents.innerHTML = "<pre>" + content + "</pre>";
    }
    else if (type === "pretty") {
      console.log("Displaying pretty content.");
      viewPrettyBtn.disabled = true;
      viewRawBtn.disabled = false;

      const headers = [];
      const keyValues = new Map();
      let currentHeader = "";

      const lines = content.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line) {
          // Header lines.
          if (line.startsWith("[") && line.endsWith("]")) {
            currentHeader = line;
            headers.push(currentHeader);
            keyValues.set(currentHeader, []);
          }
          // Key/value lines.
          else {
            const parts = line.split('=');
            if (parts.length == 2) {
              const keyPart = parts[0].trim();
              const valuePart = parts[1].trim();

              // Extract inner key if it exists.
              const keyWithMultipleValues = keyPart.match(/([^\[]+)\[([^\]]+)\]/);
              let key, innerValue;
              if (keyWithMultipleValues) {
                key = keyWithMultipleValues[1];
                innerValue = keyWithMultipleValues[2];
              } 
              else {
                key = keyPart;
                innerValue = null;
              }

              keyValues.get(currentHeader).push({
                key: key,
                innerValue: innerValue,
                value: valuePart
              });
            }
          }
        }
      });

      console.log("Headers:", headers);
      console.log("KeyValues:", keyValues);
      
      fileContents.innerHTML = "";
    }
  } 
  else {
    console.error("Could not read file content.");
  }
}