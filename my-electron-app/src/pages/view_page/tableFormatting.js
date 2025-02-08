// Format the value based on its type.
export function formatValue(value) {
  // Check for empty values first.
  if (!value || value.trim() === "") {
    return '<span class="empty-setting">-<span class="empty-label">empty</span></span>';
  }

  // Handle comma-separated values.
  if (value.includes(",")) {
    return value
      .split(",")
      .map((v) => formatNumber(formatFilePath(v.trim())))
      .join(",\n");
  }
  return formatNumber(formatFilePath(value));
}

// Format the number to a specific format.
export function formatNumber(value) {
  // Check if the value is a valid number.
  const num = parseFloat(value);
  if (isNaN(num)) {
    // Add classes for true and false values.
    if (value.toLowerCase() === "true") {
      return `<span class="bool-true">${
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      }</span>`;
    }
    if (value.toLowerCase() === "false") {
      return `<span class="bool-false">${
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      }</span>`;
    }
    return value;
  }

  // First round to 3 decimal places.
  const rounded = Number(num.toFixed(3));

  // Check if it's a whole number (either originally or after rounding).
  if (Number.isInteger(rounded)) return rounded.toString();

  return rounded.toString();
}

// Format the file path to display only the file name.
export function formatFilePath(value) {
  // Handle colon-separated file paths.
  if (value.includes(":")) {
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
    const parts = value.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  return value;
}

export function addBooleanToggle(valueCell, data) {
  if (
    data.value.toString().toLowerCase() === "true" ||
    data.value.toString().toLowerCase() === "false"
  ) {
    valueCell.currentValue = data.value;
    valueCell.onclick = () => {
      if (valueCell.currentValue.toString().toLowerCase() === "true") {
        valueCell.currentValue = "False";
        valueCell.innerHTML = formatValue("False");
      } else {
        valueCell.currentValue = "True";
        valueCell.innerHTML = formatValue("True");
      }
      console.log(data.key + " changed to " + valueCell.currentValue);
    };
  }
}
