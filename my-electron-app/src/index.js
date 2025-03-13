document.addEventListener("DOMContentLoaded", function () {
  const viewButton = document.getElementById("goToView");
  const shareButton = document.getElementById("goToShare");

  console.log("Navigated to Home page.");

  if (viewButton) {
    viewButton.addEventListener("click", () => navigate("view"));
  }

  if (shareButton) {
    shareButton.addEventListener("click", () => navigate("share"));
  }
});

function navigate(destination) {
  window.location.href = `pages/${destination}_page/${destination}.html`;
}
