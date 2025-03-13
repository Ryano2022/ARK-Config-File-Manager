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
  const validDestinations = {
    view: "pages/view_page/view.html",
    share: "pages/share_page/share.html",
    account: "pages/account_page/account.html",
  };

  if (validDestinations[destination]) {
    window.location.href = validDestinations[destination];
  } else {
    console.error("Invalid navigation destination. ");
  }
}
