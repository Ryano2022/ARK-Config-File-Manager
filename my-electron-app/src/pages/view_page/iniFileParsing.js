import { NO_FILE_MESSAGE, FILE_FOUND_MESSAGE, getDOMElements } from "./DOM.js";
import { displayFileContent } from "./userFileHandling.js";

// Check if any .ini files have been added to the app.
export async function checkIniFiles() {
  const { fileStatusText, fileAddSection, buttons } = getDOMElements();

  // Check if any elements are null.
  if (!fileStatusText || !fileAddSection || !buttons) {
    console.error(
      "Error checking .ini files: Required DOM elements not found. "
    );
    return;
  }

  const files = await window.electronAPI.checkForAddedFiles();

  if (files == "Zero") {
    console.info("No .ini files found. Showing add file section. ");
    fileStatusText.innerHTML = NO_FILE_MESSAGE;
    fileAddSection.style.display = "block";
    buttons.style.display = "none";
  } else {
    console.info(".ini file found. Displaying file content. ");
    fileStatusText.innerHTML = FILE_FOUND_MESSAGE(files[0]);
    fileStatusText.style.display = "none";
    fileAddSection.style.display = "none";
    buttons.style.display = "block";
    await displayFileContent("pretty");
  }
}

// Parse the content of the .ini file.
export async function parseIniContent(content) {
  console.info("Starting .ini file parsing. ");
  const headers = [];
  const keyValues = new Map();
  let currentHeader = "";

  const lines = content.split("\n");

  lines.forEach((line) => {
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
        const parts = line.split("=");
        if (parts.length == 2) {
          const keyPart = parts[0].trim();
          // Skip if key starts with PGARK.
          if (keyPart.startsWith("PG")) {
            console.warn("Skipping PG prefixed key: " + keyPart);
            return;
          }
          const valuePart = parts[1].trim();

          // Extract inner key if it exists.
          const keyWithMultipleValues = keyPart.match(/([^\[]+)\[([^\]]+)\]/);
          let key, innerValue;
          if (keyWithMultipleValues) {
            key = keyWithMultipleValues[1];
            innerValue = keyWithMultipleValues[2];
          } else {
            key = keyPart;
            innerValue = null;
          }

          keyValues.get(currentHeader).push({
            key: key,
            innerValue: innerValue,
            value: valuePart,
          });
        }
      }
    }
  });

  console.info(".ini file parsing completed. ");
  console.log("Parsed headers count: " + headers.length);
  console.log("Key/Value pairs parsed for " + keyValues.size + " sections. ");

  return { headers, keyValues };
}
