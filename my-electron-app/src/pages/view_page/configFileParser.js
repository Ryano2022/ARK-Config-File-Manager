import { NO_FILE_MESSAGE, FILE_FOUND_MESSAGE, getDOMElements } from "./DOM.js";
import { displayFileContent } from "./contentDisplayHandler.js";

// Check if any config files have been added to the app.
export async function checkConfigFiles() {
  const { fileStatusText, fileAddSection, buttons, buttons2ndRow } = getDOMElements();

  // Check if any elements are null.
  if (!fileStatusText || !fileAddSection || !buttons) {
    console.error("Error checking config files: Required DOM elements not found. ");
    return;
  }

  const files = await window.electronAPI.checkForAddedFiles();

  if (files == "Zero") {
    console.info("No config files found. Showing add file section. ");
    fileStatusText.innerHTML = NO_FILE_MESSAGE;
    fileAddSection.style.display = "block";
    buttons.style.display = "none";
    buttons2ndRow.style.display = "none";
  } else {
    console.info("Config file found. Displaying file content. ");
    fileStatusText.innerHTML = FILE_FOUND_MESSAGE(files[0]);
    fileStatusText.style.display = "none";
    fileAddSection.style.display = "none";
    buttons.style.display = "block";
    buttons2ndRow.style.display = "block";
    await displayFileContent("pretty");
  }
}

// Parse the content of the config file.
export async function parseConfig(content) {
  console.info("Starting config file parsing. ");
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
        // Special handling for ConfigOverrideItemMaxQuantity.
        if (line.startsWith("ConfigOverrideItemMaxQuantity")) {
          const keyPart = "ConfigOverrideItemMaxQuantity";
          const itemClassMatch = line.match(/ItemClassString="([^"]+)"/); // Match anything between quotes after ItemClassString=
          const quantityMatch = line.match(/MaxItemQuantity=(\d+)/); // Match the quantity number.

          if (itemClassMatch && quantityMatch) {
            const innerValuePart = itemClassMatch[1];
            const valuePart = quantityMatch[1];

            keyValues.get(currentHeader).push({
              key: keyPart,
              innerValue: innerValuePart,
              value: valuePart,
            });
          }
          return;
        }

        // Special handling for OverrideNamedEngramEntries.
        if (line.startsWith("OverrideNamedEngramEntries")) {
          const keyPart = "OverrideNamedEngramEntries";
          const engramMatch = line.match(/EngramClassName="([^"]+)"/);
          const hiddenMatch = line.match(/EngramHidden=(true|false)/);

          if (engramMatch && hiddenMatch) {
            const innerValuePart = engramMatch[1];
            const valuePart = hiddenMatch[1];

            keyValues.get(currentHeader).push({
              key: keyPart,
              innerValue: innerValuePart,
              value: valuePart,
            });
          }
          return;
        }

        const parts = line.split("=");
        if (parts.length == 2) {
          const keyPart = parts[0].trim();
          const valuePart = parts[1].trim();

          // Skip if key starts with PGARK.
          if (keyPart.startsWith("PG")) {
            console.warn("Skipping PG prefixed key: " + keyPart);
            return;
          }

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

  console.info("Config file parsing completed. ");
  console.log("Parsed headers count: " + headers.length);
  console.log(headers);
  console.log("Key/Value pairs parsed for " + keyValues.size + " sections. ");

  return { headers, keyValues };
}
