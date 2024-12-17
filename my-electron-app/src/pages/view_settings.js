// ASE Stat icons were downloaded from https://ark.wiki.gg/wiki/Attributes.
const ASE_STAT_ICONS = '../assets/icons/stats/evolved/';

function formatFilePath(value) {
  // Handle colon-separated file paths.
  if (value.includes(':')) {
    return `<div class="file-path-container">${
      value.split(',').map(pair => {
        const [first, second] = pair.trim().split(':');
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
      }).join('')
    }</div>`;
  }
  
  // Handle single file paths.
  if (value.includes('/') || value.includes('\\')) {
    const parts = value.split(/[/\\]/);
    return parts[parts.length - 1];
  }
  
  return value;
}

function formatValue(value) {
  // Check for empty values first.
  if (!value || value.trim() === '') {
    return '<span class="empty-setting">-<span class="empty-label">empty</span></span>';
  }
  
  // Handle comma-separated values
  if (value.includes(',')) {
    return value.split(',')
      .map(v => formatNumber(formatFilePath(v.trim())))
      .join(',\n');
  }
  return formatNumber(formatFilePath(value));
}

function formatNumber(value) {
  // Check if the value is a valid number.
  const num = parseFloat(value);
  if (isNaN(num)) {
    // Add classes for true and false values.
    if (value.toLowerCase() === 'true') {
      return `<span class="bool-true">${value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</span>`;
    }
    if (value.toLowerCase() === 'false') {
      return `<span class="bool-false">${value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</span>`;
    }
    return value;
  }
  
  // First round to 3 decimal places.
  const rounded = Number(num.toFixed(3));
  
  // Check if it's a whole number (either originally or after rounding).
  if (Number.isInteger(rounded)) return rounded.toString();
  
  return rounded.toString();
}

function addBooleanToggle(valueCell, data) {
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
          console.log(data.key + " changed to " + valueCell.currentValue);
      };
  }
}

async function checkGameini() {
  const files = await window.electronAPI.checkForAddedFiles();
  const fileStatus = document.getElementById('fileStatus');
  const addFiles = document.getElementById('addFiles');
  const buttons = document.getElementById('buttons');
  
  if (files == "Zero") {
    fileStatus.innerHTML = "<h2>No .ini file found.</h2>";
    addFiles.style.display = 'block';
    buttons.style.display = 'none';
  } 
  else { 
    fileStatus.innerHTML = `<h2>${files[0]} file found.</h2>`;
    fileStatus.style.display = 'none';
    addFiles.style.display = 'none';
    buttons.style.display = 'block';
    displayFileContent(files[0], "pretty");
  }
}

// Check for Game.ini when page loads.
window.addEventListener('DOMContentLoaded', checkGameini);

// Upload the selected file.
async function addSelectedFile() {
  const fileInput = document.getElementById('fileInput');
  const fileStatus = document.getElementById('fileStatus');
  const addFiles = document.getElementById('addFiles');
  const buttons = document.getElementById('buttons');

  // Check if a file was selected and only one file.
  if (!fileInput.files || fileInput.files.length == 0) {
    alert("No file selected.");
    return;
  }
  if (fileInput.files.length > 1) {
    alert("Please select only one file.");
    return;
  }

  const file = fileInput.files[0];
  const fileContent = await file.text();
  
  const fileData = {
    name: file.name,
    data: fileContent
  };

  // Add the file with proper data.
  const result = await window.electronAPI.addFile(fileData);
  if (result == "Success") {
    alert("Added file " + file.name + " successfully.");
    console.log("Added file " + file.name + " successfully.");
    addFiles.style.display = 'none';
    fileStatus.innerHTML = `<h2>${file.name} file found.</h2>`;
    fileStatus.style.display = 'none';
    buttons.style.display = 'block';
    displayFileContent(fileData.name, "pretty");
  } 
  else {
    alert("Error adding file.\n\n" + result);
    console.error("Error adding file: ", result);
  }
}

// Display the content of the Game.ini file. 
async function displayFileContent(filename, type) {
  const fileContents = document.getElementById('fileContents');
  const viewPrettyBtn = document.getElementById('viewPretty');
  const viewRawBtn = document.getElementById('viewRaw');
  const content = await window.electronAPI.readFile(filename);

  if (content) {
    fileContents.innerHTML = '';
    fileContents.style.display = 'block';

    viewPrettyBtn.disabled = false;
    viewRawBtn.disabled = false;

    if (type === "raw") {
      console.log("Displaying raw content.");
      viewRawBtn.disabled = true;
      fileContents.innerHTML = `<pre class="raw-view">${content}</pre>`;
    }
    else if (type === "pretty") {
      console.log("Displaying pretty content.");
      viewPrettyBtn.disabled = true;

      const headers = [];
      const keyValues = new Map();
      let currentHeader = "";

      const lines = content.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line) {
          // Skip PGARK related entries.
          if (line.includes('PG')) {
            return;
          }
          
          // Header lines.
          if (line.startsWith("[") && line.endsWith("]")) {
            currentHeader = line;
            headers.push(currentHeader);
            keyValues.set(currentHeader, []);
          }
          // Key/value lines.
          else {
            const parts = line.split('=');
            if (parts.length == 2) {
              const keyPart = parts[0].trim();
              // Skip if key starts with PGARK
              if (keyPart.startsWith('PG')) {
                return;
              }
              const valuePart = parts[1].trim();

              // Extract inner key if it exists.
              const keyWithMultipleValues = keyPart.match(/([^\[]+)\[([^\]]+)\]/);
              let key, innerValue;
              if (keyWithMultipleValues) {
                key = keyWithMultipleValues[1];
                innerValue = keyWithMultipleValues[2];
              } 
              else {
                key = keyPart;
                innerValue = null;
              }

              keyValues.get(currentHeader).push({
                key: key,
                innerValue: innerValue,
                value: valuePart
              });
            }
          }
        }
      });

      console.log("Headers:", headers);
      console.log("Key/Values:", keyValues);
      
      // For each header, create a new table.
      headers.forEach(header => {
        const headerData = keyValues.get(header);
        
        // Check if this section has any real inner values
        const hasInnerValues = headerData.some(data => 
          data.innerValue !== null && data.innerValue !== '-' && data.innerValue !== ''
        );

        const table = document.createElement('table');
        table.className = 'prettyTable';
        table.innerHTML = "<caption>" + header + "</caption>";

        // Create table header
        const headerRow = table.insertRow();
        if (hasInnerValues) {
          headerRow.innerHTML = `
            <th>Setting</th>
            <th>Inner Value</th>
            <th>Value</th>
          `;
        } 
        else {
          headerRow.innerHTML = `
            <th>Setting</th>
            <th>Value</th>
          `;
        }

        headerData.forEach(data => {
          const row = table.insertRow();
          
          const keyCell = row.insertCell(0);
          keyCell.innerHTML = data.key;

          if (hasInnerValues) {
            // Add inner value cell.
            const innerCell = row.insertCell(1);
            if (data.key.startsWith("PerLevelStatsMultiplier")) {
              const statIndex = data.innerValue;
              switch(statIndex) {
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
                  innerCell.innerHTML = data.innerValue || '-';
                  break;
              }
            } 
            else if (data.key.startsWith("ItemStatClamps")) {
              const attributeIndex = data.innerValue;
              switch(attributeIndex) {
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
                  innerCell.innerHTML = "Hypothermal Insulation (Cold Resist)";
                  break;
                case "6":
                  innerCell.innerHTML = "Weight";
                  break;
                case "7":
                  innerCell.innerHTML = "Hyperthermal Insulation (Heat Resist)";
                  break;
                default:
                  innerCell.innerHTML = data.innerValue || '-';
                  break;
              }
            }
            else {
              innerCell.innerHTML = data.innerValue || '-';
            }
            
            // Add value cell in position 2 for three-column layout.
            const valueCell = row.insertCell(2);
            valueCell.innerHTML = formatValue(data.value);
            if (data.key.startsWith("PerLevelStatsMultiplier") && data.innerValue === "6") {
              valueCell.classList.add('unused-setting');
            }
            addBooleanToggle(valueCell, data);
          } 
          else {
            // Add value cell in position 1 for two-column layout.
            const valueCell = row.insertCell(1);
            if (data.key == "KickIdlePlayersPeriod") {
              valueCell.innerHTML = `${formatValue(data.value)}<span class="time-label">seconds</span>`;
            } 
            else {
              valueCell.innerHTML = formatValue(data.value);
            }
            addBooleanToggle(valueCell, data);
          }
        });

        const spacer = document.createElement('div');
        spacer.style.height = '20px';

        fileContents.appendChild(table);
        fileContents.appendChild(spacer);
      });
    }
  } 
  else {
    console.error("Could not read file content.");
  }
}

async function changeCurrentFile() {
  try {
    const files = await window.electronAPI.checkForAddedFiles();
    if (files !== "Zero") {
      const removeResult = await window.electronAPI.removeFile(files[0]);
      if (removeResult === "Success") {
        const fileStatus = document.getElementById('fileStatus');
        const addFiles = document.getElementById('addFiles');
        const buttons = document.getElementById('buttons');
        const fileContents = document.getElementById('fileContents');
        
        fileStatus.innerHTML = "<h2>No .ini file found.</h2>";
        fileStatus.style.display = 'block';
        addFiles.style.display = 'block';
        buttons.style.display = 'none';
        fileContents.style.display = 'none';
      } 
      else {
        alert("Error removing current file: " + removeResult);
      }
    }
  } 
  catch (error) {
    alert("Error changing file: " + error);
    console.error("Error changing file:", error);
  }
}

async function getCurrentFileAndDisplay(type) {
  const files = await window.electronAPI.checkForAddedFiles();
  if (files !== "Zero") {
    displayFileContent(files[0], type);
  }
}