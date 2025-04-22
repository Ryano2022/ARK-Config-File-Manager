let shareButton, publicFilesButton, myFilesButton, uploadSection, uploadButton, fileList, user;

document.addEventListener("DOMContentLoaded", async () => {
  shareButton = document.getElementById("shareFile");
  publicFilesButton = document.getElementById("publicFiles");
  myFilesButton = document.getElementById("myFiles");
  uploadSection = document.getElementById("uploadSection");
  uploadButton = document.getElementById("uploadButton");
  fileList = document.getElementById("fileList");

  // Initialize user state immediately
  user = await window.electronAPI.getCurrentUser();

  console.log("Navigated to Share page. ");

  if (shareButton) {
    shareButton.addEventListener("click", () => switchViewMode("upload"));
  }
  if (publicFilesButton) {
    publicFilesButton.addEventListener("click", () => switchViewMode("publicFiles"));
  }
  if (myFilesButton) {
    myFilesButton.addEventListener("click", () => switchViewMode("myFiles"));
  }
  if (uploadButton) {
    uploadButton.addEventListener("click", uploadFile);
  }

  // Set up modals.
  setupModals();

  fileList.addEventListener("click", (e) => {
    const fileId = e.target.dataset.fileId;
    if (!fileId && !e.target.matches(".confirm-no") && !e.target.matches(".confirm-import-no")) return;

    if (e.target.matches(".delete-button")) {
      const container = e.target.closest(".delete-container");
      container.querySelector(".delete-confirmation").style.display = "flex";
      e.target.style.display = "none";
      container.querySelectorAll(".action-button").forEach((btn) => (btn.style.display = "none"));
    } else if (e.target.matches(".confirm-yes")) {
      removeFileFromList(fileId);
    } else if (e.target.matches(".confirm-no")) {
      const container = e.target.closest(".delete-container");
      container.querySelector(".delete-confirmation").style.display = "none";
      container.querySelector(".delete-button").style.display = "inline-flex";
      container.querySelectorAll(".action-button").forEach((btn) => (btn.style.display = "inline-flex"));
    } else if (e.target.matches(".import-button")) {
      const container = e.target.closest(".delete-container");
      container.querySelector(".import-confirmation").style.display = "flex";
      e.target.style.display = "none";
      const deleteButton = container.querySelector(".delete-button");
      if (deleteButton) deleteButton.style.display = "none";
    } else if (e.target.matches(".confirm-import-yes")) {
      importFile(fileId);
      incrementDownloadCount(fileId);
    } else if (e.target.matches(".confirm-import-no")) {
      const container = e.target.closest(".delete-container");
      container.querySelector(".import-confirmation").style.display = "none";
      container.querySelector(".import-button").style.display = "inline-flex";
      const deleteButton = container.querySelector(".delete-button");
      if (deleteButton) deleteButton.style.display = "inline-flex";
    } else if (e.target.matches(".view-info-button")) {
      openFileInfoModal(fileId);
    } else if (e.target.matches(".view-comments-button")) {
      openCommentsModal(fileId);
    }
  });

  setButtonState("publicFiles");
  populateFileList();
});

function setupModals() {
  const infoModal = document.getElementById("viewInfoModal");
  const commentsModal = document.getElementById("commentsModal");
  const closeButtons = document.querySelectorAll(".close-button");
  const cancelButtons = document.querySelectorAll(".cancel-button");

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      infoModal.style.display = "none";
      commentsModal.style.display = "none";
    });
  });

  cancelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      infoModal.style.display = "none";
      commentsModal.style.display = "none";
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === infoModal || e.target === commentsModal) {
      infoModal.style.display = "none";
      commentsModal.style.display = "none";
    }
  });
}

// Function to set button states based on current section.
function setButtonState(mode) {
  if (!shareButton || !publicFilesButton || !myFilesButton) {
    console.error("One or more navigation buttons not found. ");
    return;
  }

  shareButton.classList.remove("button-disabled");
  publicFilesButton.classList.remove("button-disabled");
  myFilesButton.classList.remove("button-disabled");

  // Set the appropriate button as disabled based on current mode.
  if (mode == "upload") {
    shareButton.classList.add("button-disabled");
  } else if (mode == "publicFiles") {
    publicFilesButton.classList.add("button-disabled");
  } else if (mode == "myFiles") {
    myFilesButton.classList.add("button-disabled");
  }
}

// Switch between different view modes (upload, public files, my files).
async function switchViewMode(mode) {
  if (!uploadSection || !fileList) {
    console.error("Required DOM elements not found. ");
    return;
  }

  if ((mode == "upload" || mode == "myFiles") && !user) {
    const currentUser = await window.electronAPI.getCurrentUser();
    if (!currentUser) {
      console.log("No logged in user. ");
      window.location.href = "../account_page/account.html?from=share";
      return;
    }
    user = currentUser;
  }

  console.log(`Switching view mode to: ${mode}`);

  // Show upload section only in upload mode, show file list in all other modes.
  const isUploadMode = mode == "upload";
  fileList.style.display = isUploadMode ? "none" : "grid";
  uploadSection.style.display = isUploadMode ? "block" : "none";

  setButtonState(mode);

  if (mode == "upload") {
    console.log("Switched to upload mode. ");
  } else if (mode == "publicFiles") {
    console.log("Switched to public files mode. ");
    await populateFileList();
  } else if (mode == "myFiles") {
    console.log("Switched to my files mode. ");
    await populateFileList(user);
  } else {
    console.error("Invalid mode. ");
  }
}

function getUsername(email) {
  if (!email) return "Unknown";
  return email.split("@")[0];
}

async function userIsLoggedIn() {
  try {
    const currentUser = await window.electronAPI.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      console.log("No valid user found. ");
      window.location.href = "../account_page/account.html";
      return null;
    }
    const username = getUsername(currentUser.email);
    if (!username) {
      console.log("Could not get username for: ", currentUser.email);
      return null;
    }
    console.log("User is logged in: ", username);
    return username;
  } catch (error) {
    console.error("Error checking if user is logged in: ", error);
    return null;
  }
}

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const descriptionShort = document.getElementById("descriptionShort").value;
  const descriptionLong = document.getElementById("descriptionLong").value;

  if (!fileInput || !fileInput.files[0] || !descriptionShort) {
    console.error("Please fill in all required fields. ");
    return;
  }

  const file = fileInput.files[0];
  const fileContent = await file.text();
  const timestamp = new Date().toISOString();

  const fileData = {
    name: file.name,
    descriptionShort: descriptionShort,
    descriptionLong: descriptionLong,
    content: fileContent,
    uploadedBy: user,
    uploadedAt: timestamp,
  };

  try {
    console.log("Uploading file to Firestore: ", fileData.name);
    const result = await window.electronAPI.addFileToFirestore(fileData);
    console.log("Upload result: ", result);
    if (result.success) {
      fileInput.value = "";
      document.getElementById("descriptionShort").value = "";
      document.getElementById("descriptionLong").value = "";
      console.log("File uploaded successfully! ");
      switchViewMode("myFiles");
    } else {
      if (result.error.includes("permission-denied")) {
        console.error("Permission denied: You don't have access to upload files. ");
      } else {
        console.error("Error uploading file: ", result.error);
      }
    }
  } catch (error) {
    console.error("Upload error: ", error);
  }
}

function canModifyFile(file) {
  if (!user || !file.uploadedBy) return false;
  return user.uid === file.uploadedBy.uid;
}

async function addFileToList(file) {
  if (!file || !fileList) return;

  const fileElement = document.createElement("div");
  const isCurrentUser = user && file.uploadedBy?.email == user.email;
  fileElement.className = `file-item ${isCurrentUser ? "current-user-file" : ""}`;
  const username = getUsername(file.uploadedBy?.email);

  const deleteButton = canModifyFile(file)
    ? `<div class="delete-confirmation">
         <div class="confirm-message">Are you sure?</div>
         <div class="button-group">
           <button class="confirm-yes" data-file-id="${file.id}">Yes</button>
           <button class="confirm-no">No</button>
         </div>
       </div>
       <button class="delete-button" data-file-id="${file.id}">Delete</button>`
    : "";

  const importButton = `
    <div class="import-confirmation">
      <div class="confirm-message">This will overwrite any file currently being worked on. Continue?</div>
      <div class="button-group">
        <button class="confirm-import-yes" data-file-id="${file.id}">Yes</button>
        <button class="confirm-import-no">No</button>
      </div>
    </div>
    <button class="action-button import-button" data-file-id="${file.id}">Import</button>
  `;

  const downloadCount = file.downloadCount || 0;
  const rating = file.ratings ? calculateRating(file.ratings) : 0;
  const ratingStars = rating > 0 ? `⭐ ${rating.toFixed(1)}` : "";

  fileElement.innerHTML = `
    <div class="file-header">
      <h3>${file.name || "Unknown File"}</h3>
      <span class="uploaded-by ${isCurrentUser ? "current-user" : ""}">Uploaded by: ${username || "Unknown"}</span>
    </div>
    <p class="description-short">${file.descriptionShort || "No description provided. "}</p>
    ${file.descriptionLong ? `<p class="description-long">${file.descriptionLong}</p>` : ""}
    
    <div class="info-buttons-container">
      <button class="action-button view-comments-button" data-file-id="${file.id}">Comments</button>
      <button class="action-button view-info-button" data-file-id="${file.id}">Info</button>
    </div>
    
    <div class="delete-container">
      <div class="file-stats">
        <span class="download-count" title="Number of imports. ">⬇️ ${downloadCount}</span>
        ${rating > 0 ? `<span class="rating-display" title="Average rating. ">${ratingStars}</span>` : ""}
      </div>
      ${deleteButton}
      ${importButton}
    </div>
  `;

  fileList.appendChild(fileElement);
}

async function removeFileFromList(fileId) {
  try {
    console.log("Attempting to remove file: ", fileId);
    const files = await window.electronAPI.retrieveFilesFromFirestore({ id: fileId });
    console.log("File check result:", files);

    const file = files[0];

    if (!file || !canModifyFile(file)) {
      console.error("Permission denied: Cannot delete this file. ");
      return;
    }

    const result = await window.electronAPI.removeFileFromFirestore(fileId);
    console.log("Remove result: ", result);
    if (result.success) {
      const fileElement = document.querySelector(`.file-item:has(button[data-file-id="${fileId}"])`);
      if (fileElement) {
        fileElement.remove();
      }
      console.log("File deleted successfully. ");
    } else {
      if (result.error.includes("permission-denied")) {
        console.error("Permission denied: You don't have permission to delete this file. ");
      } else {
        console.error("Error removing file:", result.error);
      }
    }
  } catch (error) {
    console.error("Remove error: ", error);
  }
}

async function populateFileList(userFilter = null) {
  if (!fileList) return;

  fileList.innerHTML = "";

  try {
    console.log("Retrieving files with filter:", userFilter);
    const result = await window.electronAPI.retrieveFilesFromFirestore(userFilter);
    console.log("Retrieved files:", result);
    if (Array.isArray(result)) {
      if (result.length == 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = userFilter
          ? "You haven't uploaded any files yet."
          : "No files have been shared yet.";
        fileList.appendChild(emptyMessage);
        return;
      }

      // Sort files: null uploadedAt first, then by date descending.
      const sortedFiles = result.sort((a, b) => {
        if (!a.uploadedAt) return -1;
        if (!b.uploadedAt) return 1;
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      });
      sortedFiles.forEach((file) => addFileToList(file));
    } else if (result.error && result.error.includes("permission-denied")) {
      console.error("Permission denied: Cannot access file list. ");
    }
  } catch (error) {
    console.error("Populate error: ", error);
  }
}

async function importFile(fileId) {
  console.log("Importing file:", fileId);

  try {
    const result = await window.electronAPI.downloadFileFromFirestore(fileId);
    console.log("Import result: ", result);

    if (result.success) {
      console.log("Successfully imported file: ", result.fileName);
      window.location.href = "../view_page/view.html?from=share";
    } else {
      console.error("Failed to import file: ", result.error);
    }
  } catch (error) {
    console.error("Import error: ", error);
  }
}

async function incrementDownloadCount(fileId) {
  try {
    const result = await window.electronAPI.incrementDownloadCount(fileId);
    console.log("Increment download count result: ", result);
  } catch (error) {
    console.error("Error incrementing download count: ", error);
  }
}

async function addComment(fileId, comment) {
  try {
    const result = await window.electronAPI.addComment(fileId, comment);
    console.log("Added comment to file: ", fileId);
    return result;
  } catch (error) {
    console.error("Error adding comment: ", error);
  }
}

async function deleteComment(fileId, commentId) {
  try {
    const result = await window.electronAPI.deleteComment(fileId, commentId);
    console.log("Deleted comment from file: ", fileId);
    return result;
  } catch (error) {
    console.error("Error deleting comment: ", error);
  }
}

async function addRating(fileId, rating) {
  try {
    const result = await window.electronAPI.addRating(fileId, rating);
    console.log("Updated rating for file: ", fileId);
    return result;
  } catch (error) {
    console.error("Error updating rating: ", error);
  }
}

function calculateRating(ratings) {
  const upperBoundary = 5;
  const lowerBoundary = 0;
  let numOfRatings = ratings.length;
  let sumOfRatings = 0;
  let averageRating = 0;

  // Default return of 0 if no ratings are provided.
  if (!ratings || ratings.length == 0) {
    return 0;
  } else {
    // Actually calculate if ratings are provided.
    for (let i = 0; i < ratings.length; i++) {
      if (ratings[i] < lowerBoundary || ratings[i] > upperBoundary) {
        console.error("Invalid rating value: ", ratings[i]);
        numOfRatings--;
        continue;
      } else {
        sumOfRatings += ratings[i];
      }
    }

    averageRating = sumOfRatings / numOfRatings;
  }

  return averageRating;
}

async function openFileInfoModal(fileId) {
  try {
    console.log("Opening file info modal for:", fileId);
    const files = await window.electronAPI.retrieveFilesFromFirestore({ id: fileId });

    if (files && files.length > 0) {
      const file = files[0];
      const modal = document.getElementById("viewInfoModal");
      const modalContent = modal.querySelector(".modal-content");

      // Update modal content with file information.
      const username = getUsername(file.uploadedBy?.email);
      const downloadCount = file.downloadCount || 0;
      const uploadDate = file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : "Unknown";
      const rating = file.ratings ? calculateRating(file.ratings) : 0;
      const ratingStars = "⭐".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

      // Create HTML content for the modal.
      modalContent.innerHTML = `
        <span class="close-button">&times;</span>
        <h2>${file.name || "Unknown File"}</h2>
        <div class="file-details">
          <p><strong>Uploaded by:</strong> ${username || "Unknown"}</p>
          <p><strong>Upload date:</strong> ${uploadDate}</p>
          <p><strong>Times imported:</strong> ${downloadCount}</p>
          <p><strong>Rating:</strong> ${ratingStars} (${rating.toFixed(1)})</p>
          ${file.descriptionShort ? `<p><strong>Short description:</strong> ${file.descriptionShort}</p>` : ""}
          ${file.descriptionLong ? `<p><strong>Detailed description:</strong> ${file.descriptionLong}</p>` : ""}
        </div>
        
        <div class="form-buttons">
          <button type="button" class="view-comments-button" data-file-id="${file.id}">View Comments</button>
          <button type="button" class="cancel-button">Close</button>
        </div>
      `;

      // Set up close button.
      modalContent.querySelector(".close-button").addEventListener("click", () => {
        modal.style.display = "none";
      });

      // Set up cancel button.
      modalContent.querySelector(".cancel-button").addEventListener("click", () => {
        modal.style.display = "none";
      });

      // Set up view comments button.
      modalContent.querySelector(".view-comments-button").addEventListener("click", () => {
        modal.style.display = "none";
        openCommentsModal(file.id);
      });

      // Display the modal.
      modal.style.display = "block";
    } else {
      console.error("File not found.");
    }
  } catch (error) {
    console.error("Error opening file info modal: ", error);
  }
}

async function openCommentsModal(fileId) {
  try {
    console.log("Opening comments modal for:", fileId);
    const files = await window.electronAPI.retrieveFilesFromFirestore({ id: fileId });

    if (files && files.length > 0) {
      const file = files[0];
      const modal = document.getElementById("commentsModal");
      const modalContent = modal.querySelector(".comments-modal-content");

      // Update header with file name and rating.
      const fileTitle = modalContent.querySelector("h2");
      const rating = file.ratings ? calculateRating(file.ratings) : 0;
      const ratingStars = "⭐".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

      fileTitle.textContent = file.name || "Unknown File";

      // Update comments container.
      const comments = file.comments || [];
      const commentsContainer = modalContent.querySelector(".comments-container");
      commentsContainer.innerHTML =
        comments.length > 0 ? renderComments(comments) : '<p class="no-comments">No comments yet.</p>';

      // Rating stars functionality.
      let selectedRating = 0;
      const stars = modalContent.querySelectorAll(".star");
      const submitRatingBtn = modalContent.querySelector("#submitRating");

      // Reset stars.
      highlightStars(stars, 0);
      submitRatingBtn.disabled = true;

      stars.forEach((star) => {
        star.addEventListener("mouseover", function () {
          const rating = parseInt(this.dataset.rating);
          highlightStars(stars, rating);
        });

        star.addEventListener("mouseout", function () {
          highlightStars(stars, selectedRating);
        });

        star.addEventListener("click", function () {
          selectedRating = parseInt(this.dataset.rating);
          highlightStars(stars, selectedRating);
          submitRatingBtn.disabled = false;
        });
      });

      submitRatingBtn.addEventListener("click", async () => {
        if (!user) {
          window.location.href = "../account_page/account.html?from=share";
          return;
        }

        if (selectedRating > 0) {
          try {
            const result = await addRating(fileId, selectedRating);
            if (result && result.success) {
              console.log("Rating submitted successfully. ");
              modal.style.display = "none";
            } else {
              console.log("Failed to submit rating. Please try again. ");
            }
          } catch (error) {
            console.error("Error submitting rating. ");
          }
        }
      });

      const submitCommentBtn = modalContent.querySelector("#submitComment");
      const commentTextArea = modalContent.querySelector("#commentText");
      commentTextArea.value = "";

      submitCommentBtn.addEventListener("click", async () => {
        const commentText = commentTextArea.value.trim();
        if (!commentText) {
          console.log("Empty comment. ");
          return;
        }

        if (!user) {
          window.location.href = "../account_page/account.html?from=share";
          return;
        }

        const comment = {
          text: commentText,
          author: user,
          timestamp: new Date().toISOString(),
        };

        try {
          const result = await addComment(fileId, comment);
          if (result && result.success) {
            // Refresh comments.
            const updatedFiles = await window.electronAPI.retrieveFilesFromFirestore({ id: fileId });
            if (updatedFiles && updatedFiles.length > 0) {
              const updatedComments = updatedFiles[0].comments || [];
              commentsContainer.innerHTML = renderComments(updatedComments);
              commentTextArea.value = "";
            }
          } else {
            console.error("Failed to post comment. Please try again. ");
          }
        } catch (error) {
          console.error("Error posting comment. ");
        }
      });
      modal.dataset.fileId = fileId;

      // Display the modal.
      modal.style.display = "block";
    } else {
      console.error("File not found.");
    }
  } catch (error) {
    console.error("Error opening comments modal:", error);
  }
}

function highlightStars(stars, rating) {
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = "★";
      star.classList.add("selected");
    } else {
      star.textContent = "☆";
      star.classList.remove("selected");
    }
  });
}

function renderComments(comments) {
  if (!comments || comments.length == 0) {
    return '<p class="no-comments">No comments yet. </p>';
  }

  return comments
    .map((comment, index) => {
      const commentAuthor = comment.author ? getUsername(comment.author.email) : "Anonymous";
      const commentDate = comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : "Unknown date";

      return `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-author">${commentAuthor}</span>
          <span class="comment-date">${commentDate}</span>
        </div>
        <p class="comment-text">${comment.text}</p>
      </div>
    `;
    })
    .join("");
}
