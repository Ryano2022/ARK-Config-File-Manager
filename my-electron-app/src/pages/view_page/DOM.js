// UI Messages.
export const NO_FILE_MESSAGE = "<h2>No .ini file found.</h2>";
export const FILE_FOUND_MESSAGE = (filename) =>
  `<h2>${filename} file found.</h2>`;

// DOM Elements.
let fileStatusText,
  fileContents,
  fileAddSection,
  buttons,
  viewPrettyBtn,
  viewRawBtn,
  addFilesBtn,
  changeFileBtn,
  saveFileBtn;

// Initialise all DOM elements.
export function initialiseDOM() {
  console.log("Initialising the DOM elements... ");

  fileStatusText = document.getElementById("fileStatusText");
  fileContents = document.getElementById("fileContents");
  fileAddSection = document.getElementById("fileAddSection");
  buttons = document.getElementById("buttons");

  addFilesBtn = document.getElementById("addFilesButton");
  viewPrettyBtn = document.getElementById("viewPretty");
  viewRawBtn = document.getElementById("viewRaw");
  changeFileBtn = document.getElementById("changeFile");
  saveFileBtn = document.getElementById("saveFile");

  // Verify all elements were found.
  if (
    !fileStatusText ||
    !fileContents ||
    !fileAddSection ||
    !buttons ||
    !addFilesBtn ||
    !viewPrettyBtn ||
    !viewRawBtn ||
    !changeFileBtn ||
    !saveFileBtn
  ) {
    console.error("Failed to find all required DOM elements");
    return null;
  }

  return getDOMElements();
}

// Get DOM elements for use in other modules.
export function getDOMElements() {
  return {
    fileStatusText,
    fileContents,
    fileAddSection,
    buttons,
    viewPrettyBtn,
    viewRawBtn,
    addFilesBtn,
    changeFileBtn,
    saveFileBtn,
  };
}
