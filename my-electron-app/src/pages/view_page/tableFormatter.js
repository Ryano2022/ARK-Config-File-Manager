// Format the value based on its type.
export function formatValue(value) {
  // Check for empty values first.
  if (!value || value.trim() === "") {
    //console.info("Empty value detected, returning placeholder. ");
    return '<span class="empty-setting">-<span class="empty-label">empty</span></span>';
  }

  // Handle comma-separated values.
  if (value.includes(",")) {
    //console.info("Processing comma-separated value: " + value);
    return value
      .split(",")
      .map((v) => formatNumber(formatFilePath(v.trim())))
      .join(",\n");
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
  // Handle colon-separated file paths.
  if (value.includes(":")) {
    //console.info("Processing colon-separated paths. ");
    return `<div class="file-path-container">${value
      .split(",")
      .map((pair) => {
        const [first, second] = pair.trim().split(":");
        const firstPath = first.split(/[/\\]/).pop();
        const secondPath = second.split(/[/\\]/).pop();
        return `
           <div class="file-path-pair">
             <div class="first-path">
               <span class="file-path">${firstPath}</span>
               <span class="path-separator">:</span>
             </div>
             <div class="second-path">
               <span class="file-path">${secondPath}</span>
             </div>
           </div>
         `;
      })
      .join("")}</div>`;
  }

  // Handle single file paths.
  if (value.includes("/") || value.includes("\\")) {
    //console.info("Extracting filename from path: " + value);
    const parts = value.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  return value;
}
