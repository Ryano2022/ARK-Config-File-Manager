import {
  displayFileContent,
  addSelectedFile,
  changeCurrentFile,
  saveCurrentFile,
} from "./userFileHandling.js";

import { checkIniFiles } from "./iniFileParsing.js";
import { initialiseDOM } from "./DOM.js";

window.addEventListener("DOMContentLoaded", async () => {
  // Initialise DOM elements first.
  const elements = initialiseDOM();
  if (!elements) {
    console.error("Failed to initialise DOM elements.");
    return;
  }

  // Adding event listeners for buttons.
  elements.addFilesBtn.addEventListener("click", addSelectedFile);
  elements.viewPrettyBtn.addEventListener("click", () =>
    displayFileContent("pretty")
  );
  elements.viewRawBtn.addEventListener("click", () =>
    displayFileContent("raw")
  );
  elements.changeFileBtn.addEventListener("click", changeCurrentFile);
  elements.saveFileBtn.addEventListener("click", saveCurrentFile);

  // Start the app.
  await checkIniFiles();
});
