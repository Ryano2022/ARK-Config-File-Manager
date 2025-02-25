import { getDOMElements } from "./DOM.js";
import { parseConfig } from "./configFileParser.js";
import { formatValue, addBooleanToggle, formatNumber } from "./tableFormatter.js";

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

function createInputField(value, type = "number") {
  const inputType = type == "password" ? "password" : "number";
  const step = type == "number" ? 'step="0.00001"' : "";
  const placeholder = 'placeholder="- empty"';

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
    ActiveMapMod: "Test",
  };
  return tooltips[key] || "No description available. ";
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
          table.className = "prettyTable";
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
            keyCell.setAttribute("data-tooltip", tooltipText);

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
                  innerCell.innerHTML = data.innerValue || "-";
                }

                const valueCell = row.insertCell(2);
                if (!isNaN(parseFloat(data.value))) {
                  valueCell.innerHTML = createInputField(data.value);
                } else {
                  valueCell.innerHTML = formatValue(data.value);
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
                } else {
                  valueCell.innerHTML = formatValue(data.value);
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
