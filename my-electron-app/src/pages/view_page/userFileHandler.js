import { NO_FILE_MESSAGE, FILE_FOUND_MESSAGE, getDOMElements } from "./DOM.js";
import { parseConfig } from "./configFileParser.js";
import { displayFileContent } from "./contentDisplayHandler.js";

function handleError(message, error) {
  alert(`${message}\n${error}`);
  console.error(`${message}:`, error);
}

function updateUIState({
  fileStatusText,
  showStatus = true,
  message = "",
  showAddSection = false,
  showButtons = false,
  showContent = false,
}) {
  const { fileAddSection, buttons, fileContents } = getDOMElements();

  if (fileStatusText) {
    fileStatusText.style.display = showStatus ? "block" : "none";
    if (message) fileStatusText.innerHTML = message;
  }

  fileAddSection.style.display = showAddSection ? "block" : "none";
  buttons.style.display = showButtons ? "block" : "none";
  fileContents.style.display = showContent ? "block" : "none";
}

// Sets the selected file as the one to be displayed.
export async function addSelectedFile() {
  const { fileStatusText } = getDOMElements();
  const fileInput = document.getElementById("fileInput");

  if (!fileInput.files || fileInput.files.length == 0) {
    handleError("No file selected. ", "Please select a file to add. ");
    return;
  }
  if (fileInput.files.length > 1) {
    handleError("Multiple files selected. ", "Please select only one file. ");
    return;
  }

  const file = fileInput.files[0];
  const fileContent = await file.text();

  const fileData = {
    name: file.name,
    data: fileContent,
  };

  const result = await window.electronAPI.addFile(fileData);
  if (result == "Success") {
    updateUIState({
      fileStatusText,
      showStatus: false,
      message: FILE_FOUND_MESSAGE(file.name),
      showButtons: true,
    });
    displayFileContent("pretty");
  } else {
    handleError("Error adding file. ", result);
  }
}

// Change the selected file to the one that was added.
export async function changeCurrentFile() {
  console.log("Changing file. ");
  const { fileStatusText, viewPrettyBtn, viewRawBtn } = getDOMElements();

  try {
    const files = await window.electronAPI.checkForAddedFiles();
    if (files != "Zero") {
      const removeResult = await window.electronAPI.removeFile(files[0]);
      if (removeResult == "Success") {
        updateUIState({
          fileStatusText,
          message: NO_FILE_MESSAGE,
          showAddSection: true,
        });
        viewPrettyBtn.disabled = false;
        viewRawBtn.disabled = false;
      } else {
        handleError("Error removing current file. ", removeResult);
      }
    }
  } catch (error) {
    handleError("Error changing file. ", error);
  }
}

// Helper function to format the value to assist the save function.
function getCellValue(cell) {
  const input = cell.querySelector("input");
  if (input) {
    if (input.type == "password") {
      return input.value;
    }
    const num = parseFloat(input.value);
    if (!isNaN(num)) {
      const rounded = Math.floor(num * 1000) / 1000;
      return rounded.toString();
    }
    return input.value;
  }

  if (cell.innerText.includes("-") || cell.innerText.includes("empty")) return "";
  if (cell.innerText.toLowerCase() == "true" || cell.innerText.toLowerCase() == "false") return cell.innerText;

  // Check if it's a stat.
  if (text.includes("Health")) return "0";
  if (text.includes("Stamina")) return "1";
  if (text.includes("Torpidity")) return "2";
  if (text.includes("Oxygen")) return "3";
  if (text.includes("Food")) return "4";
  if (text.includes("Water")) return "5";
  if (text.includes("Temperature")) return "6";
  if (text.includes("Weight")) return "7";
  if (text.includes("Melee Damage")) return "8";
  if (text.includes("Movement Speed")) return "9";
  if (text.includes("Fortitude")) return "10";
  if (text.includes("Crafting Speed")) return "11";

  // Check if it includes a comma.
  if (cell.innerText.includes(",")) {
    return cell.innerText
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => value !== "")
      .join(",")
      .replace(/,+/g, ",")
      .replace(/^,|,$/g, "");
  }

  return cell.innerText;
}

// Save the current file with the new content.
export async function saveCurrentFile() {
  const files = await window.electronAPI.checkForAddedFiles();
  const filename = files[0];
  const { headers, keyValues } = await parseConfig(filename);

  console.info("Saving file. ");

  // If a file was found.
  if (files != "Zero") {
    const tables = document.getElementsByTagName("table");
    let content = "";
    let captionCount = 0;

    // Loop through each table and extract the content.
    for (const table of tables) {
      const caption = table.querySelector("caption");

      // Add the header.
      if (captionCount > 0) {
        content += "\n" + caption.innerText.trim() + "\n";
      } else {
        content += caption.innerText.trim() + "\n";
      }
      captionCount++;

      // Get the rows except the header.
      const rows = Array.from(table.rows).slice(1);

      for (const row of rows) {
        const cells = Array.from(row.cells);
        const key = cells[0].innerText;

        // Special handling for ConfigOverrideItemMaxQuantity.
        if (key == "ConfigOverrideItemMaxQuantity") {
          const innerValue = getCellValue(cells[1]);
          const value = getCellValue(cells[2]);
          content += `${key}=(ItemClassString="${innerValue}",Quantity=(MaxItemQuantity=${value},bIgnoreMultiplier=True))`;
        }
        // Special handling for OverrideNamedEngramEntries.
        else if (key == "OverrideNamedEngramEntries") {
          const innerValue = getCellValue(cells[1]);
          const value = getCellValue(cells[2]);
          content += `${key}=(EngramClassName="${innerValue}",EngramHidden=${value})`;
        } else {
          content += key;
          // Normal key-value handling
          if (cells.length == 2) {
            const value = getCellValue(cells[1]);
            content += "=" + value;
          } else if (cells.length == 3) {
            const innerValue = getCellValue(cells[1]);
            const value = getCellValue(cells[2]);
            if (innerValue != "" && innerValue != "-") {
              content += "[" + innerValue + "]=" + value;
            } else {
              content += "=" + value;
            }
          }
        }
        content += "\n";
      }
    }

    console.log("Content:\n" + content);
    const saveResult = await window.electronAPI.saveFile(filename, content);
    if (saveResult == "Success") {
      alert("File saved successfully! ");
      console.log("File saved successfully. ");
    } else {
      alert("Error saving file: " + saveResult);
      console.error("Error saving file: ", saveResult);
    }
  }
  // If no file was found.
  else {
    alert("No file found to save. ");
    console.log("Error saving file: No file found. ");
  }
}
