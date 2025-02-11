import { NO_FILE_MESSAGE, FILE_FOUND_MESSAGE, getDOMElements } from "./DOM.js";
import { parseIniContent } from "./iniFileParsing.js";

import {
  formatValue,
  formatNumber,
  addBooleanToggle,
} from "./tableFormatting.js";

// ASE Stat icons were downloaded from https://ark.wiki.gg/wiki/Attributes.
const ASE_STAT_ICONS = "../../assets/icons/stats/evolved/";

// Sets the selected file as the one to be displayed.
export async function addSelectedFile() {
  const { fileAddSection, buttons, fileStatusText } = getDOMElements();
  const fileInput = document.getElementById("fileInput");

  // Check if a file was selected and only one file.
  if (!fileInput.files || fileInput.files.length == 0) {
    alert("No file selected.");
    console.warn("No file was selected to be added. ");
    return;
  }
  if (fileInput.files.length > 1) {
    alert("Please select only one file.");
    console.warn(
      "More than one file was attempted to be added but prevented. "
    );
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
    alert("Added file " + file.name + " successfully.");
    console.log("Added file " + file.name + " successfully.");
    fileAddSection.style.display = "none";
    fileStatusText.innerHTML = FILE_FOUND_MESSAGE(file.name);
    fileStatusText.style.display = "none";
    buttons.style.display = "block";
    displayFileContent("pretty");
  } else {
    alert("Error adding file.\n\n" + result);
    console.error("Error adding file: ", result);
  }
}

// Change the selected file to the one that was added.
export async function changeCurrentFile() {
  console.log("Changing file. ");
  const {
    fileStatusText,
    fileAddSection,
    buttons,
    fileContents,
    viewPrettyBtn,
    viewRawBtn,
  } = getDOMElements();
  try {
    const files = await window.electronAPI.checkForAddedFiles();
    if (files != "Zero") {
      const removeResult = await window.electronAPI.removeFile(files[0]);
      if (removeResult == "Success") {
        fileStatusText.innerHTML = NO_FILE_MESSAGE;
        fileStatusText.style.display = "block";
        fileAddSection.style.display = "block";
        buttons.style.display = "none";
        fileContents.innerHTML = "";
        fileContents.style.display = "none";
        viewPrettyBtn.disabled = false;
        viewRawBtn.disabled = false;
      } else {
        alert("Error removing current file: " + removeResult);
        console.error("Error removing current file: ", removeResult);
      }
    }
  } catch (error) {
    alert("Error changing file: " + error);
    console.error("Error changing file:", error);
  }
}

// Save the current file with the new content.
export async function saveCurrentFile() {
  const files = await window.electronAPI.checkForAddedFiles();
  const filename = files[0];
  const { headers, keyValues } = await parseIniContent(filename);

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
      console.log("File saved successfully.");
    } else {
      alert("Error saving file: " + saveResult);
      console.error("Error saving file: ", saveResult);
    }
  }
  // If no file was found.
  else {
    alert("No file found to save.");
    console.log("Error saving file: No file found.");
  }
}

// Helper function to format the stat values to be displayed in the table.
function getStatValue(text) {
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
  return text;
}

// Helper function to format the value to assist the save function.
function getCellValue(cell) {
  const input = cell.querySelector("input");
  if (input) {
    const num = parseFloat(input.value);
    if (!isNaN(num)) {
      return Number(num.toFixed(3)).toString();
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

  // Check if the cell has a time value.
  if (cell.innerText.includes("seconds"))
    return cell.innerText.split("seconds")[0].trim();

  // Check if the cell has an unused tag.
  if (cell.innerText.includes("unused")) {
    if (cell.innerText.includes("Temperature")) {
      return "6";
    } else {
      return cell.innerText.split("unused")[0].trim();
    }
  }

  // Check if it's a stat.
  if (
    cell.innerText.includes("Health") ||
    cell.innerText.includes("Stamina") ||
    cell.innerText.includes("Torpidity") ||
    cell.innerText.includes("Oxygen") ||
    cell.innerText.includes("Food") ||
    cell.innerText.includes("Water") ||
    cell.innerText.includes("Weight") ||
    cell.innerText.includes("Melee Damage") ||
    cell.innerText.includes("Movement Speed") ||
    cell.innerText.includes("Fortitude") ||
    cell.innerText.includes("Crafting Speed") ||
    cell.innerText.includes("Temperature")
  ) {
    return getStatValue(cell.innerText);
  }

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
        console.log("Displaying raw content.");
        viewRawBtn.disabled = true;
        fileContents.innerHTML = `<pre class="raw-view">${content}</pre>`;
      } else if (type == "pretty") {
        console.log("Displaying pretty content.");
        viewPrettyBtn.disabled = true;

        const { headers, keyValues } = await parseIniContent(content);

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
               <th>Setting</th>
               <th>Value</th>
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
                  switch (statIndex) {
                    case "0":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}health.webp' alt='Health' /> Health`;
                      break;
                    case "1":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}stamina.webp' alt='Stamina icon' /> Stamina`;
                      break;
                    case "2":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}torpidity.webp' alt='Torpidity icon' /> Torpidity`;
                      break;
                    case "3":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}oxygen.webp' alt='Oxygen icon' /> Oxygen`;
                      break;
                    case "4":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}food.webp' alt='Food icon' /> Food`;
                      break;
                    case "5":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}water.webp' alt='Water icon' /> Water`;
                      break;
                    case "6":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}fortitude.webp' alt='Fortitude icon' /> Temperature <span class="unused-label">unused</span>`;
                      break;
                    case "7":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}weight.webp' alt='Weight icon' /> Weight`;
                      break;
                    case "8":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}melee_damage.webp' alt='Melee Damage icon' /> Melee Damage`;
                      break;
                    case "9":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}movement_speed.webp' alt='Movement Speed icon' /> Movement Speed`;
                      break;
                    case "10":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}fortitude.webp' alt='Fortitude icon' /> Fortitude`;
                      break;
                    case "11":
                      innerCell.innerHTML = `<img class='stat-icon' src='${ASE_STAT_ICONS}crafting_speed.webp' alt='Crafting Speed icon' /> Crafting Speed`;
                      break;
                    default:
                      innerCell.innerHTML = data.innerValue || "-";
                      break;
                  }
                } else if (data.key.startsWith("ItemStatClamps")) {
                  const attributeIndex = data.innerValue;
                  switch (attributeIndex) {
                    case "0":
                      innerCell.innerHTML = "Generic Quality";
                      break;
                    case "1":
                      innerCell.innerHTML = "Armour";
                      break;
                    case "2":
                      innerCell.innerHTML = "Max Durability";
                      break;
                    case "3":
                      innerCell.innerHTML = "Weapon Damage Percent";
                      break;
                    case "4":
                      innerCell.innerHTML = "Weapon Clip Ammo";
                      break;
                    case "5":
                      innerCell.innerHTML =
                        "Hypothermal Insulation (Cold Resist)";
                      break;
                    case "6":
                      innerCell.innerHTML = "Weight";
                      break;
                    case "7":
                      innerCell.innerHTML =
                        "Hyperthermal Insulation (Heat Resist)";
                      break;
                    default:
                      innerCell.innerHTML = data.innerValue || "-";
                      break;
                  }
                } else {
                  innerCell.innerHTML = data.innerValue || "-";
                }

                const valueCell = row.insertCell(2);
                // Only use input for numeric values.
                if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = `<input type="number" step="any" class="value-input" value="${formatNumber(
                    data.value
                  )}">`;
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
                    valueCell.innerHTML = `<input type="number" step="any" class="value-input" value="${formatNumber(
                      numValue
                    )}"><span class="time-label">seconds</span>`;
                  } else {
                    valueCell.innerHTML = `${formatValue(
                      data.value
                    )}<span class="time-label">seconds</span>`;
                  }
                } else if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = `<input type="number" step="any" class="value-input" value="${formatNumber(
                    data.value
                  )}">`;
                } else {
                  valueCell.innerHTML = formatValue(data.value);
                }
                addBooleanToggle(valueCell, data);
              }
            } else {
              // Add value cell in position 1 for two-column layout.
              const valueCell = row.insertCell(1);
              if (data.key == "KickIdlePlayersPeriod") {
                const numValue = parseFloat(data.value);
                if (!isNaN(numValue)) {
                  valueCell.innerHTML = `<input type="number" step="any" class="value-input" value="${formatNumber(
                    numValue
                  )}"><span class="time-label">seconds</span>`;
                } else {
                  valueCell.innerHTML = `${formatValue(
                    data.value
                  )}<span class="time-label">seconds</span>`;
                }
              } else if (!isNaN(parseFloat(data.value))) {
                valueCell.innerHTML = `<input type="number" step="any" class="value-input" value="${formatNumber(
                  data.value
                )}">`;
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
      console.error("Could not read file content.");
    }
  } catch (error) {
    console.error("Error displaying file content:", error);
  }
}

function getTooltipDescription(key) {
  const tooltips = {
    ActiveMapMod: "Test",
  };
  return tooltips[key] || "No description available. ";
}
