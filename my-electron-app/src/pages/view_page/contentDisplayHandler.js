import { getDOMElements } from "./DOM.js";
import { parseConfig } from "./configFileParser.js";
import { formatValue, addBooleanToggle, formatNumber } from "./tableFormatter.js";
import { itemClasses as itemsASERaw } from "../../assets/data/evolved/itemClasses.js";
import { engramEntries as engramsASERaw } from "../../assets/data/evolved/engramEntries.js";
import { STAT_MAPPING, ATTRIBUTE_MAPPING } from "../../assets/data/stats.js";

// ASE Stat icons were downloaded from https://ark.wiki.gg/wiki/Attributes.
const ASE_STAT_ICONS = "../../assets/icons/stats/evolved/";

const itemsASE = Object.fromEntries(Object.entries(itemsASERaw).map(([key, value]) => [key.toLowerCase(), value]));
const engramsASE = Object.fromEntries(Object.entries(engramsASERaw).map(([key, value]) => [key.toLowerCase(), value]));

function createInputField(value, type = "text") {
  // Use text type by default, with specific cases for other types.
  const inputType = type === "password" ? "password" : type === "number" ? "number" : "text";

  const step = inputType === "number" ? 'step="0.00001"' : "";
  const placeholder = 'placeholder="Not Set"';

  let formattedValue = value;
  if (type === "number" && value !== null && value !== undefined && value !== "") {
    formattedValue = formatNumber(value);
  }

  return `<input type="${inputType}" ${step} ${placeholder} class="value-input" value="${formattedValue || ""}">`;
}

function getStatIconHTML(statIndex) {
  const stat = STAT_MAPPING[statIndex];
  if (!stat) return statIndex;
  const unusedLabel = stat.unused ? ' <span class="unused-label">unused</span>' : "";
  return `<img class='stat-icon' src='${ASE_STAT_ICONS}${stat.icon}' alt='${stat.name} icon' /> ${stat.name}${unusedLabel}`;
}

function getAttributeText(attributeIndex) {
  const attribute = ATTRIBUTE_MAPPING[attributeIndex];
  return attribute ? attribute.name : attributeIndex;
}

function getTooltipDescription(key) {
  const tooltips = {
    ActiveMapMod: "Sets the active map mod for the server.",
  };
  return tooltips[key] || `No description available for ${key}`;
}

export function getDisplayName(technicalName) {
  let searchString = technicalName.toLowerCase();

  return itemsASE[searchString] || engramsASE[searchString] || technicalName;
}

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

        headers.forEach((header) => {
          const headerData = keyValues.get(header);

          const hasInnerValues = headerData.some(
            (data) => data.innerValue != null && data.innerValue != "-" && data.innerValue != ""
          );

          const table = document.createElement("table");
          table.className = hasInnerValues ? "three-columns" : "two-columns";
          table.innerHTML = "<caption>" + header + "</caption>";

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
            keyCell.setAttribute("title", tooltipText);
            keyCell.setAttribute("data-original-key", data.key);

            // Handle ConvertClass entries
            if (data.key === "ConvertClass" && data.value) {
              const conversions = data.value.split(",").filter((conv) => conv.trim());
              if (conversions.length > 0) {
                const valueCell = row.insertCell(1);

                const conversionsList = conversions
                  .map((conv) => {
                    const [source, target] = conv.split(":");
                    // Apply getDisplayName to the source and target values
                    return `
                    <div class="conversion-pair">
                      <input type="text" class="value-input" value="${getDisplayName(
                        source.trim()
                      )}" data-original-value="${source.trim()}">
                      <span class="pair-separator">:</span>
                      <input type="text" class="value-input" value="${
                        target ? getDisplayName(target.trim()) : ""
                      }" data-original-value="${target ? target.trim() : ""}">
                    </div>
                  `;
                  })
                  .join("");

                valueCell.innerHTML = '<div class="conversion-list">' + conversionsList + "</div>";
                return;
              }
            }

            // Handle ConfigOverrideItemMaxQuantity
            if (data.key === "ConfigOverrideItemMaxQuantity") {
              const match = data.value.match(/ItemClassString="([^"]+)",Quantity=\(MaxItemQuantity=(\d+)/);
              if (match) {
                const [_, path, quantity] = match;
                const valueCell = row.insertCell(1);
                // Convert the technical blueprint path to a friendly name when displaying.
                const formattedValue = data.value.replace(path, getDisplayName(path));
                valueCell.innerHTML = formatValue(formattedValue);
                valueCell.setAttribute("data-original-value", data.value);
                return;
              }
            }

            // Handle colon-separated values.
            if (data.value && data.value.includes(":")) {
              const [firstPath, secondPath] = data.value.split(":");
              const leftCell = row.insertCell(1);
              const rightCell = row.insertCell(2);

              const firstDisplayName = getDisplayName(firstPath.trim());
              const secondDisplayName = getDisplayName(secondPath.trim());

              leftCell.innerHTML = createInputField(firstDisplayName, "text");
              leftCell.querySelector("input").setAttribute("data-original-value", firstPath.trim());

              rightCell.innerHTML = createInputField(secondDisplayName, "text");
              rightCell.querySelector("input").setAttribute("data-original-value", secondPath.trim());
              return;
            }

            // Handle general three-column layout.
            if (hasInnerValues) {
              if (data.innerValue && data.innerValue != "-" && data.innerValue != "") {
                const innerCell = row.insertCell(1);
                if (data.key.startsWith("PerLevelStatsMultiplier")) {
                  const statIndex = data.innerValue;
                  innerCell.innerHTML = getStatIconHTML(statIndex);
                } else if (data.key.startsWith("ItemStatClamps")) {
                  const attributeIndex = data.innerValue;
                  innerCell.innerHTML = getAttributeText(attributeIndex);
                } else {
                  innerCell.innerHTML = getDisplayName(data.innerValue) || "-";
                  innerCell.setAttribute("data-original-value", data.innerValue);
                }

                const valueCell = row.insertCell(2);
                if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = createInputField(data.value);
                } else {
                  valueCell.innerHTML = formatValue(getDisplayName(data.value));
                  valueCell.setAttribute("data-original-value", data.value);
                }

                if (data.key.startsWith("PerLevelStatsMultiplier") && data.innerValue == "6") {
                  valueCell.classList.add("unused-setting");
                }
                addBooleanToggle(valueCell, data);
              } else {
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
                  valueCell.innerHTML = createInputField(data.value, "password");
                } else if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = createInputField(data.value);
                } else if (!data.value || data.value.trim() === "") {
                  // Convert empty values to inputs.
                  valueCell.innerHTML = createInputField("", "text");
                } else {
                  const displayValue = getDisplayName(data.value);
                  valueCell.innerHTML = formatValue(displayValue);
                  if (displayValue !== data.value) {
                    valueCell.setAttribute("data-original-value", data.value);
                  }
                }
                addBooleanToggle(valueCell, data);
              }
            } else {
              const valueCell = row.insertCell(1);
              if (
                data.key == "ServerAdminPassword" ||
                data.key == "ServerPassword" ||
                data.key == "SpectatorPassword"
              ) {
                valueCell.innerHTML = createInputField(data.value, "password");
              } else if (!isNaN(parseFloat(data.value))) {
                valueCell.innerHTML = createInputField(data.value);
              } else if (!data.value || data.value.trim() === "") {
                // Convert empty values to inputs.
                valueCell.innerHTML = createInputField("", "text");
              } else {
                const displayValue = getDisplayName(data.value);
                valueCell.innerHTML = formatValue(displayValue);
                if (displayValue !== data.value) {
                  valueCell.setAttribute("data-original-value", data.value);
                }
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
