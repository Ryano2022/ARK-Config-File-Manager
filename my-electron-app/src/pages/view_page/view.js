import { displayFileContent } from "./contentDisplayHandler.js";
import { addSelectedFile, changeCurrentFile, saveCurrentFile } from "./userFileHandler.js";
import { checkConfigFiles } from "./configFileParser.js";
import { initialiseDOM } from "./DOM.js";

window.addEventListener("DOMContentLoaded", async () => {
  console.info("Starting application initialisation. ");

  // Initialise DOM elements first.
  const elements = initialiseDOM();
  if (!elements) {
    console.error("Error initialising application: DOM elements not found. ");
    return;
  }

  // Adding event listeners for buttons.
  elements.addFilesBtn.addEventListener("click", addSelectedFile);
  elements.viewPrettyBtn.addEventListener("click", () => displayFileContent("pretty"));
  elements.viewRawBtn.addEventListener("click", () => displayFileContent("raw"));
  elements.changeFileBtn.addEventListener("click", changeCurrentFile);
  elements.saveFileBtn.addEventListener("click", saveCurrentFile);

  // Start the app.
  await checkConfigFiles();
  console.info("Application initialisation completed. ");
});
