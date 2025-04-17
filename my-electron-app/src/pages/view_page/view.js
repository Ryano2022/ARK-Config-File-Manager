import { displayFileContent } from "./contentDisplayHandler.js";
import { addSelectedFile, changeCurrentFile, saveCurrentFile } from "./userFileHandler.js";
import { checkConfigFiles } from "./configFileParser.js";
import { initialiseDOM } from "./DOM.js";

function setButtonState(elements, mode) {
  mode == "pretty"
    ? (elements.viewPrettyBtn.classList.add("button-disabled"), elements.viewRawBtn.classList.remove("button-disabled"))
    : (elements.viewPrettyBtn.classList.remove("button-disabled"),
      elements.viewRawBtn.classList.add("button-disabled"));
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("Navigated to View page. ");
  console.info("Starting application initialisation. ");
  let removeMode = false;

  // Initialise DOM elements first.
  const elements = initialiseDOM();
  if (!elements) {
    console.error("Error initialising application: DOM elements not found. ");
    return;
  }

  // Adding event listeners for buttons.
  elements.addFilesBtn.addEventListener("click", addSelectedFile);
  elements.viewPrettyBtn.addEventListener("click", () => {
    displayFileContent("pretty");
    setButtonState(elements, "pretty");
  });
  elements.viewRawBtn.addEventListener("click", () => {
    displayFileContent("raw");
    setButtonState(elements, "raw");
  });
  elements.changeFileBtn.addEventListener("click", changeCurrentFile);
  elements.saveFileBtn.addEventListener("click", saveCurrentFile);
  elements.addRowBtn.addEventListener("click", () => {
    console.log("Add row button clicked. ");
  });
  elements.removeRowBtn.addEventListener("click", () => {
    elements.notifier.style.display = elements.notifier.style.display == "none" ? "block" : "none";
    removeMode = !removeMode;
    console.log("Remove mode: ", removeMode);
  });

  setButtonState(elements, "pretty");

  // Start the app.
  await checkConfigFiles();
  console.info("Application initialisation completed. ");
});
