import { displayFileContent, addSetting, removeMode } from "./contentDisplayHandler.js";
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

  // Initialise DOM elements first.
  const elements = initialiseDOM();
  if (!elements) {
    console.error("Error initialising application: DOM elements not found. ");
    return;
  }

  elements.buttons2ndRow.style.display = "none";

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
  elements.addRowBtn.addEventListener("click", addSetting);
  elements.removeRowBtn.addEventListener("click", removeMode);

  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") {
      const modal = document.getElementById("addSettingModal");
      if (modal.style.display == "block") {
        modal.style.display = "none";
      }
    }
  });

  setButtonState(elements, "pretty");

  // Start the app.
  await checkConfigFiles();
  console.info("Application initialisation completed. ");
});
