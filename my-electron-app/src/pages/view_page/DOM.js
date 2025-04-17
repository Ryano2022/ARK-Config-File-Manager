// UI Messages.
export const NO_FILE_MESSAGE = "<h2>No config file found.</h2>";
export const FILE_FOUND_MESSAGE = (filename) => `<h2>${filename} file found.</h2>`;

// DOM Elements.
let fileStatusText,
  fileContents,
  fileAddSection,
  buttons,
  buttons2ndRow,
  viewPrettyBtn,
  viewRawBtn,
  addFilesBtn,
  changeFileBtn,
  saveFileBtn,
  addRowBtn,
  removeRowBtn,
  notifier;

// Initialise all DOM elements.
export function initialiseDOM() {
  console.info("Starting DOM elements initialisation. ");

  fileStatusText = document.getElementById("fileStatusText");
  fileContents = document.getElementById("fileContents");
  fileAddSection = document.getElementById("fileAddSection");
  buttons = document.getElementById("buttons");
  buttons2ndRow = document.getElementById("buttons2ndRow");

  addFilesBtn = document.getElementById("addFilesButton");
  viewPrettyBtn = document.getElementById("viewPretty");
  viewRawBtn = document.getElementById("viewRaw");
  changeFileBtn = document.getElementById("changeFile");
  saveFileBtn = document.getElementById("saveFile");
  addRowBtn = document.getElementById("addRow");
  removeRowBtn = document.getElementById("removeRow");
  notifier = document.getElementById("notifier");

  // Verify all elements were found.
  if (
    !fileStatusText ||
    !fileContents ||
    !fileAddSection ||
    !buttons ||
    !buttons2ndRow ||
    !addFilesBtn ||
    !viewPrettyBtn ||
    !viewRawBtn ||
    !changeFileBtn ||
    !saveFileBtn ||
    !addRowBtn ||
    !removeRowBtn ||
    !notifier
  ) {
    console.error("Failed to initialise DOM: Missing required elements. ");
    return null;
  }

  console.info("DOM elements initialised successfully. ");
  return getDOMElements();
}

// Get DOM elements for use in other modules.
export function getDOMElements() {
  if (!fileStatusText || !fileContents) {
    console.warn("Accessing DOM elements before initialisation. ");
  }

  return {
    fileStatusText,
    fileContents,
    fileAddSection,
    buttons,
    buttons2ndRow,
    viewPrettyBtn,
    viewRawBtn,
    addFilesBtn,
    changeFileBtn,
    saveFileBtn,
    addRowBtn,
    removeRowBtn,
    notifier,
  };
}
