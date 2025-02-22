import { NO_FILE_MESSAGE, FILE_FOUND_MESSAGE, getDOMElements } from "./DOM.js";
import { parseConfig } from "./configFileParser.js";
import { formatValue, addBooleanToggle } from "./tableFormatter.js";

// ASE Stat icons were downloaded from https://ark.wiki.gg/wiki/Attributes.
const ASE_STAT_ICONS = "../../assets/icons/stats/evolved/";

const STAT_MAPPING = {
  0: { name: "Health", icon: "health.webp" },
  1: { name: "Stamina", icon: "stamina.webp" },
  2: { name: "Torpidity", icon: "torpidity.webp" },
  3: { name: "Oxygen", icon: "oxygen.webp" },
  4: { name: "Food", icon: "food.webp" },
  5: { name: "Water", icon: "water.webp" },
  6: { name: "Temperature", icon: "fortitude.webp", unused: true },
  7: { name: "Weight", icon: "weight.webp" },
  8: { name: "Melee Damage", icon: "melee_damage.webp" },
  9: { name: "Movement Speed", icon: "movement_speed.webp" },
  10: { name: "Fortitude", icon: "fortitude.webp" },
  11: { name: "Crafting Speed", icon: "crafting_speed.webp" },
};

const ATTRIBUTE_MAPPING = {
  0: { name: "Generic Quality" },
  1: { name: "Armour" },
  2: { name: "Max Durability" },
  3: { name: "Weapon Damage Percent" },
  4: { name: "Weapon Clip Ammo" },
  5: { name: "Hypothermal Insulation (Cold Resist)" },
  6: { name: "Weight" },
  7: { name: "Hyperthermal Insulation (Heat Resist)" },
};

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

function getStatIconHTML(statIndex) {
  const stat = STAT_MAPPING[statIndex];
  if (!stat) return statIndex;
  const unusedLabel = stat.unused
    ? ' <span class="unused-label">unused</span>'
    : "";
  return `<img class='stat-icon' src='${ASE_STAT_ICONS}${stat.icon}' alt='${stat.name} icon' /> ${stat.name}${unusedLabel}`;
}

function getAttributeText(attributeIndex) {
  const attribute = ATTRIBUTE_MAPPING[attributeIndex];
  return attribute ? attribute.name : attributeIndex;
}

function getTooltipDescription(key) {
  const tooltips = {
    ActiveMapMod: "Test",
  };
  return tooltips[key] || "No description available. ";
}

function createInputField(value, type = "number") {
  const inputType = type == "password" ? "password" : "number";
  const step = type == "number" ? 'step="0.001"' : "";
  const placeholder = 'placeholder="- empty"';

  // Format numeric values.
  let formattedValue = value;
  if (
    type === "number" &&
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const rounded = Math.floor(num * 1000) / 1000;
      formattedValue = Number.isInteger(rounded) ? rounded : rounded;
    }
  }

  return `<input type="${inputType}" ${step} ${placeholder} class="value-input" value="${
    formattedValue || ""
  }">`;
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

  // Add the file with proper data.
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

  // First filter out the - and empty values.
  if (cell.innerText.includes("-") || cell.innerText.includes("empty"))
    return "";

  // Check if the cell has a boolean value.
  if (
    cell.innerText.toLowerCase() == "true" ||
    cell.innerText.toLowerCase() == "false"
  )
    return cell.innerText;

  // Check if the cell has an unused tag.
  if (cell.innerText.includes("unused")) {
    if (cell.innerText.includes("Temperature")) {
      return "6";
    } else {
      return cell.innerText.split("unused")[0].trim();
    }
  }

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

  // Check if the cell is a CSV value.
  if (cell.innerText.includes(",")) {
    return cell.innerText
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => value !== "") // Remove empty entries.
      .join(",")
      .replace(/,+/g, ",") // Replace multiple commas with single comma.
      .replace(/^,|,$/g, ""); // Remove leading/trailing commas.
  }

  // If it's not recognised or doesn't need formatting.
  return cell.innerText;
}

// Display the content of the file.
export async function displayFileContent(type) {
  const { fileContents, viewPrettyBtn, viewRawBtn } = getDOMElements();

  try {
    const files = await window.electronAPI.checkForAddedFiles();
    if (files == "Zero") {
      console.error("No files found. ");
      return;
    }

    const content = await window.electronAPI.readFile(files[0]);

    if (content) {
      fileContents.innerHTML = "";
      fileContents.style.display = "block";

      viewPrettyBtn.disabled = false;
      viewRawBtn.disabled = false;

      if (type == "raw") {
        console.log("Displaying raw content. ");
        viewRawBtn.disabled = true;
        fileContents.innerHTML = `<pre class="raw-view">${content}</pre>`;
      } else if (type == "pretty") {
        console.log("Displaying pretty content. ");
        viewPrettyBtn.disabled = true;

        const { headers, keyValues } = await parseConfig(content);

        // For each header, create a new table.
        headers.forEach((header) => {
          const headerData = keyValues.get(header);

          // Check if this section has any real inner values
          const hasInnerValues = headerData.some(
            (data) =>
              data.innerValue != null &&
              data.innerValue != "-" &&
              data.innerValue != ""
          );

          const table = document.createElement("table");
          table.className = "prettyTable";
          table.innerHTML = "<caption>" + header + "</caption>";

          // Create table header
          const headerRow = table.insertRow();
          if (hasInnerValues) {
            headerRow.innerHTML = `
               <th>Settings</th>
               <th>Values</th>
               <th> </th>
             `;
          } else {
            headerRow.innerHTML = `
               <th>Settings</th>
               <th>Values</th>
             `;
          }

          headerData.forEach((data) => {
            const row = table.insertRow();
            const keyCell = row.insertCell(0);
            const tooltipText = getTooltipDescription(data.key);
            keyCell.innerHTML = data.key;
            keyCell.setAttribute("data-tooltip", tooltipText);

            if (hasInnerValues) {
              if (
                data.innerValue &&
                data.innerValue != "-" &&
                data.innerValue != ""
              ) {
                // Add inner value cell and regular value cell.
                const innerCell = row.insertCell(1);
                if (data.key.startsWith("PerLevelStatsMultiplier")) {
                  const statIndex = data.innerValue;
                  innerCell.innerHTML = getStatIconHTML(statIndex);
                } else if (data.key.startsWith("ItemStatClamps")) {
                  const attributeIndex = data.innerValue;
                  innerCell.innerHTML = getAttributeText(attributeIndex);
                } else {
                  innerCell.innerHTML = data.innerValue || "-";
                }

                const valueCell = row.insertCell(2);
                // Only use input for numeric values.
                if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = createInputField(data.value);
                } else {
                  valueCell.innerHTML = formatValue(data.value);
                }

                if (
                  data.key.startsWith("PerLevelStatsMultiplier") &&
                  data.innerValue == "6"
                ) {
                  valueCell.classList.add("unused-setting");
                }
                addBooleanToggle(valueCell, data);
              } else {
                // Add a single cell that spans two columns for the value.
                const valueCell = row.insertCell(1);
                valueCell.colSpan = 2;
                if (data.key == "KickIdlePlayersPeriod") {
                  const numValue = parseFloat(data.value);
                  if (!isNaN(numValue)) {
                    valueCell.innerHTML = createInputField(numValue);
                  } else {
                    valueCell.innerHTML = formatValue(data.value);
                  }
                } else if (
                  data.key == "ServerAdminPassword" ||
                  data.key == "ServerPassword" ||
                  data.key == "SpectatorPassword"
                ) {
                  valueCell.innerHTML = createInputField(
                    data.value,
                    "password"
                  );
                } else if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = createInputField(data.value);
                } else {
                  valueCell.innerHTML = formatValue(data.value);
                }
                addBooleanToggle(valueCell, data);
              }
            } else {
              // Add value cell in position 1 for two-column layout.
              const valueCell = row.insertCell(1);
              if (
                data.key == "ServerAdminPassword" ||
                data.key == "ServerPassword" ||
                data.key == "SpectatorPassword"
              ) {
                valueCell.innerHTML = createInputField(data.value, "password");
              } else if (!isNaN(parseFloat(data.value))) {
                valueCell.innerHTML = createInputField(data.value);
              } else {
                valueCell.innerHTML = formatValue(data.value);
              }
              addBooleanToggle(valueCell, data);
            }
          });

          const spacer = document.createElement("div");
          spacer.style.height = "20px";

          fileContents.appendChild(table);
          fileContents.appendChild(spacer);
        });
      }
    } else {
      console.error("Could not read file content. ");
    }
  } catch (error) {
    console.error("Error displaying file content: ", error);
  }
}
