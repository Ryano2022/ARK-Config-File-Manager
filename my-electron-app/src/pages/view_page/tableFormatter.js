// Format the value based on its type.
export function formatValue(value) {
  // For empty values, return an input field instead of the "Not Set" span
  if (!value || value.trim() === "") {
    return createInputField("", "text");
  }

  // Handle comma-separated values.
  if (value.includes(",")) {
    const items = value
      .split(",")
      .map((v) => formatNumber(formatFilePath(v.trim())))
      .filter((v) => v); // Remove empty entries
    return `<ul class="csv-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }
  if (value.toLowerCase() == "true") {
    return formatBooleanValue(value, "true");
  }
  if (value.toLowerCase() == "false") {
    return formatBooleanValue(value, "false");
  }
  return formatNumber(formatFilePath(value));
}

function formatBooleanValue(value, type) {
  const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return `<span class="bool-${type}">${formattedValue}</span>`;
}

export function addBooleanToggle(valueCell, data) {
  if (data.value.toString().toLowerCase() === "true" || data.value.toString().toLowerCase() === "false") {
    valueCell.currentValue = data.value;
    valueCell.onclick = () => {
      if (valueCell.currentValue.toString().toLowerCase() === "true") {
        valueCell.currentValue = "False";
        valueCell.innerHTML = formatValue("False");
      } else {
        valueCell.currentValue = "True";
        valueCell.innerHTML = formatValue("True");
      }
      console.info("Boolean toggle changed " + data.key + " to " + valueCell.currentValue);
    };
  }
}

// Format the number to a specific format.
export function formatNumber(value) {
  // Check if the value is a valid number.
  const num = parseFloat(value);
  if (isNaN(num)) {
    // Handle non-numeric values
    if (value.toLowerCase() === "true") {
      return formatBooleanValue(value, "true");
    }
    if (value.toLowerCase() === "false") {
      return formatBooleanValue(value, "false");
    }
    return value;
  }

  // Round to 5 decimal places.
  const rounded = Math.floor(num * 100000) / 100000;

  // If it's a whole number, return without decimals.
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }

  // Otherwise return with up to 5 decimal places.
  return rounded.toString();
}

// Format the file path to display only the file name.
export function formatFilePath(value) {
  // Handle single file paths
  if (value.includes("/") || value.includes("\\")) {
    const parts = value.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  return value;
}

// Helper function to create an input field
function createInputField(value, type = "text") {
  const placeholder = 'placeholder="Not Set"';
  return `<input type="${type}" ${placeholder} class="value-input" value="${value || ""}">`;
}
