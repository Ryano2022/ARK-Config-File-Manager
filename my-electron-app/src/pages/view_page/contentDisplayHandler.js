// DOM and parsing utilities.
import { getDOMElements } from "./DOM.js";
import { parseConfig } from "./configFileParser.js";
import { formatValue, addBooleanToggle, formatNumber } from "./tableFormatter.js";

// Display names for ARK: Survival Evolved.
import { ITEM_CLASSES as itemsASERaw } from "../../assets/lists/evolved/itemClasses.js";
import { ENGRAM_ENTRIES as engramsASERaw } from "../../assets/lists/evolved/engramEntries.js";
import { ITEM_CLASSES_MODS as modItemsASERaw } from "../../assets/lists/evolved/modItemClasses.js";
import { ENGRAM_ENTRIES_MODS as modEngramsASERaw } from "../../assets/lists/evolved/modEngramEntries.js";

// Display names for ARK: Survival Ascended.
import { ITEM_CLASSES as itemsASARaw } from "../../assets/lists/ascended/itemClasses.js";
import { ENGRAM_ENTRIES as engramsASARaw } from "../../assets/lists/ascended/engramEntries.js";
import { ITEM_CLASSES_MODS as modItemsASARaw } from "../../assets/lists/ascended/modItemClasses.js";
import { ENGRAM_ENTRIES_MODS as modEngramsASARaw } from "../../assets/lists/ascended/modEngramEntries.js";

// Statisitcs and Attributes from ARK series.
import { STAT_MAPPING, ATTRIBUTE_MAPPING } from "../../assets/lists/stats.js";

// Tooltips for the settings from ARK series.
import { TOOLTIPS } from "../../assets/lists/tooltips.js";
import { getAITooltip, tooltipCache } from "./aiTooltips.js";

// Stat icons and game logo icons were downloaded from https://ark.wiki.gg/
// Generic platform icons were downloaded from https://lineicons.com/
const ASE_STAT_ICONS = "../../assets/icons/stats/evolved/";
const ASA_STAT_ICONS = "../../assets/icons/stats/ascended/"; // Unimplemented for now.
const EXCLUSIVITY_ICONS = "../../assets/icons/exclusivity/";

// Process all the raw display name data.
const itemsASE = lowercaseObjectKeys(itemsASERaw);
const engramsASE = lowercaseObjectKeys(engramsASERaw);
const modItemsASE = lowercaseObjectKeys(modItemsASERaw);
const modEngramsASE = lowercaseObjectKeys(modEngramsASERaw);

const itemsASA = lowercaseObjectKeys(itemsASARaw);
const engramsASA = lowercaseObjectKeys(engramsASARaw);
const modItemsASA = lowercaseObjectKeys(modItemsASARaw);
const modEngramsASA = lowercaseObjectKeys(modEngramsASARaw);

function createInputField(value, type = "text") {
  // Use text type by default, with specific cases for other types.
  const inputType = type == "password" ? "password" : type == "number" ? "number" : "text";

  const step = inputType == "number" ? 'step="0.00001"' : "";
  const placeholder = 'placeholder="Not Set"';

  let formattedValue = value;
  if (type == "number" && value != null && value != undefined && value != "") {
    formattedValue = formatNumber(value);
  }

  return `<input type="${inputType}" ${step} ${placeholder} class="value-input" value="${formattedValue || ""}">`;
}

function getStatIconHTML(statIndex) {
  const stat = STAT_MAPPING[statIndex];
  if (!stat) return statIndex;
  const unusedLabel = stat.unused ? ' <span class="unused-label">unused</span>' : "";
  return `<img class='stat-icon' src='${ASE_STAT_ICONS}${stat.icon}' alt='${stat.name} icon.' /> ${stat.name}${unusedLabel}`;
}

function getExclusivityIconHTML(iconName) {
  if (!iconName) return "";
  const validIcons = ["ascended_logo", "evolved_logo", "gamepad", "phone"];
  if (!validIcons.includes(iconName)) return "";
  return `<img class='exclusivity-icon' src='${EXCLUSIVITY_ICONS}${iconName}.png' alt='${iconName} icon.' />`;
}

function getAttributeText(attributeIndex) {
  const attribute = ATTRIBUTE_MAPPING[attributeIndex];
  return attribute ? attribute.name : attributeIndex;
}

async function getTooltipDescription(key) {
  // First check if we have a predefined tooltip.
  const predefinedTooltip = TOOLTIPS[key];
  if (predefinedTooltip) return predefinedTooltip;

  // Then check if it's in the cache.
  if (tooltipCache[key]) return tooltipCache[key];

  // If not, try to get an AI-generated one.
  try {
    const aiTooltip = await getAITooltip(key);
    if (aiTooltip) return aiTooltip;
  } catch (error) {
    console.warn(`Failed to get AI tooltip for ${key}:`, error);
  }

  // If all else fails, return a default message.
  return `No description available for ${key}`;
}

function lowercaseObjectKeys(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value]));
}

function getDisplayNameWithExclusivity(technicalName) {
  let searchString = technicalName.toLowerCase();
  let displayName = technicalName;
  let isASAExclusive = false;
  let isModContent = false;

  // First check ASA (Ascended) sources
  const asaName =
    itemsASA[searchString] || engramsASA[searchString] || modItemsASA[searchString] || modEngramsASA[searchString];
  const aseName =
    itemsASE[searchString] || engramsASE[searchString] || modItemsASE[searchString] || modEngramsASE[searchString];

  if (asaName) {
    displayName = asaName;
    isASAExclusive = true;
    isModContent = Boolean(modItemsASA[searchString] || modEngramsASA[searchString]);
  } else {
    // Then check ASE (Evolved) sources
    displayName = aseName || technicalName;
    isModContent = Boolean(modItemsASE[searchString] || modEngramsASE[searchString]);
  }

  return {
    name: displayName,
    isASAExclusive,
    isModContent,
  };
}

export function getDisplayName(technicalName) {
  const { name, isASAExclusive, isModContent } = getDisplayNameWithExclusivity(technicalName);
  let prefix = "";

  if (isASAExclusive) prefix += getExclusivityIconHTML("ascended_logo");
  if (isModContent) prefix += '<span class="mod-indicator">mod</span>';

  return prefix ? `${prefix} ${name}` : name;
}

async function loadFileContent() {
  const files = await window.electronAPI.checkForAddedFiles();
  if (files == "Zero") {
    console.error("No files found. ");
    return null;
  }

  const content = await window.electronAPI.readFile(files[0]);
  return content;
}

export async function displayFileContent(type) {
  const { fileContents, viewPrettyBtn, viewRawBtn } = getDOMElements();

  try {
    const content = await loadFileContent();
    if (!content) return;

    fileContents.innerHTML = "";
    fileContents.style.display = "block";
    viewPrettyBtn.disabled = false;
    viewRawBtn.disabled = false;

    if (type == "raw") {
      console.log("Displaying raw content. ");
      viewRawBtn.disabled = true;
      displayRawContent(content, fileContents);
    } else if (type == "pretty") {
      console.log("Displaying pretty content. ");
      viewPrettyBtn.disabled = true;
      await displayPrettyContent(content, fileContents);
    }
  } catch (error) {
    console.error("Error displaying file content: ", error);
  }
}

function displayRawContent(content, fileContents) {
  fileContents.innerHTML = `<pre class="raw-view">${content}</pre>`;
}

async function displayPrettyContent(content, fileContents) {
  const { headers, keyValues } = await parseConfig(content);

  headers.forEach(async (header) => {
    const headerData = keyValues.get(header);
    const hasInnerValues = headerData.some(
      (data) => data.innerValue != null && data.innerValue != "-" && data.innerValue != ""
    );

    const table = createTableHeader(header, hasInnerValues);

    for (const data of headerData) {
      await processTableRow(table, data, hasInnerValues);
    }

    const spacer = document.createElement("div");
    spacer.style.height = "20px";

    fileContents.appendChild(table);
    fileContents.appendChild(spacer);
  });
}

function createTableHeader(header, hasInnerValues) {
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

  return table;
}

async function processTableRow(table, data, hasInnerValues) {
  const row = table.insertRow();
  const keyCell = row.insertCell(0);
  const tooltipText = await getTooltipDescription(data.key);
  keyCell.innerHTML = data.key;
  keyCell.setAttribute("title", tooltipText);
  keyCell.setAttribute("data-original-key", data.key);

  // Handle special cases.
  if (data.key == "ConvertClass" && data.value) {
    if (handleConvertClass(row, data)) return;
  }

  if (data.key == "ConfigOverrideItemMaxQuantity") {
    if (handleConfigOverrideItemMaxQuantity(row, data)) return;
  }

  if (handleColonSeparatedValues(row, data)) return;

  // Handle general three-column layout.
  if (hasInnerValues) {
    // If it has an inner value that isn't a dash or empty string.
    if (data.innerValue && data.innerValue != "-" && data.innerValue != "") {
      handleCellWithInnerValue(row, data);
    } else {
      const valueCell = row.insertCell(1);
      valueCell.colSpan = 2;

      if (!handleSpecialValueCases(valueCell, data)) {
        handleStandardValueCell(valueCell, data);
      }
    }
  } else {
    const valueCell = row.insertCell(1);
    if (!handleSpecialValueCases(valueCell, data)) {
      handleStandardValueCell(valueCell, data);
    }
  }
}

// Function to handle special case for ConvertClass.
function handleConvertClass(row, data) {
  const conversions = data.value.split(",").filter((conv) => conv.trim());
  if (conversions.length > 0) {
    const valueCell = row.insertCell(1);

    const conversionsList = conversions
      .map((conv) => {
        const [source, target] = conv.split(":");
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
    return true; // Has been handled.
  }
  return false; // Has not been handled.
}

// Function to handle special case for ConfigOverrideItemMaxQuantity.
function handleConfigOverrideItemMaxQuantity(row, data) {
  const match = data.value.match(/ItemClassString="([^"]+)",Quantity=\(MaxItemQuantity=(\d+)/);
  if (match) {
    const [_, path, quantity] = match;
    const valueCell = row.insertCell(1);
    // Convert the technical blueprint path to a friendly name when displaying.
    const formattedValue = data.value.replace(path, getDisplayName(path));
    valueCell.innerHTML = formatValue(formattedValue);
    valueCell.setAttribute("data-original-value", data.value);
    return true;
  }
  return false;
}

function handleColonSeparatedValues(row, data) {
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
    return true; // Has been handled.
  }
  return false; // Has not been handled.
}

function handleCellWithInnerValue(row, data) {
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

  // Special case for unused settings.
  if (data.key.startsWith("PerLevelStatsMultiplier") && data.innerValue == "6") {
    valueCell.classList.add("unused-setting");
  }
  addBooleanToggle(valueCell, data);
}

// Function to handle special cases for certain values.
function handleSpecialValueCases(valueCell, data) {
  // Special case for KickIdlePlayersPeriod.
  if (data.key == "KickIdlePlayersPeriod") {
    const numValue = parseFloat(data.value);
    if (!isNaN(numValue)) {
      valueCell.innerHTML = createInputField(numValue);
    } else {
      valueCell.innerHTML = formatValue(data.value);
    }
    return true; // Has been handled.
  }

  // Special case for password settings.
  if (data.key == "ServerAdminPassword" || data.key == "ServerPassword" || data.key == "SpectatorPassword") {
    valueCell.innerHTML = createInputField(data.value, "password");
    return true; // Has been handled.
  }

  return false; // Has not been handled.
}

// Function to handle standard value cells.
function handleStandardValueCell(valueCell, data) {
  if (!isNaN(parseFloat(data.value))) {
    valueCell.innerHTML = createInputField(data.value);
  } else if (!data.value || data.value.trim() == "") {
    // Convert empty values to inputs
    valueCell.innerHTML = createInputField("", "text");
  } else {
    const displayValue = getDisplayName(data.value);
    valueCell.innerHTML = formatValue(displayValue);
    if (displayValue != data.value) {
      valueCell.setAttribute("data-original-value", data.value);
    }
  }
  addBooleanToggle(valueCell, data);
}
