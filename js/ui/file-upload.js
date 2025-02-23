// Store uploaded files, the index of the currently selected file for editing,
// and a copy of the original image before edits.
let files = [];
let selectedFileIndex = null;
let originalImage = null; // Store the original image for editing.

/**
 * Initializes the file upload and image editing UI.
 */
export function initFileUpload() {
  console.log('File upload initialized');

  // Get references to DOM elements.
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const convertBtn = document.getElementById('convert-btn');
  const editControls = document.getElementById('edit-controls');
  const applyEditBtn = document.getElementById('apply-edit');
  const editPreview = document.getElementById('edit-preview');
  const cropWidthInput = document.getElementById('crop-width');
  const cropHeightInput = document.getElementById('crop-height');
  const resizeWidthInput = document.getElementById('resize-width');
  const resizeHeightInput = document.getElementById('resize-height');
  const rotateAngleInput = document.getElementById('rotate-angle');

  // --- Drag-and-Drop Event Handlers ---
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // Prevent default behavior to allow drop.
    console.log('Dragover event triggered');
    dropZone.classList.add('border-blue-500'); // Add visual cue.
  });

  dropZone.addEventListener('dragleave', () => {
    console.log('Dragleave event triggered');
    dropZone.classList.remove('border-blue-500'); // Remove visual cue.
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); // Prevent default browser behavior (opening the file).
    console.log('Drop event triggered', e.dataTransfer.files);
    dropZone.classList.remove('border-blue-500'); // Remove visual cue.
    handleFiles(e.dataTransfer.files); // Process the dropped files.
  });

  // --- File Input Event Handlers ---
  dropZone.addEventListener('click', () => {
    console.log('Drop zone clicked');
    fileInput.click(); // Trigger the file input's click event.
  });

  fileInput.addEventListener('change', () => {
    console.log('File input changed', fileInput.files);
    handleFiles(fileInput.files); // Process the selected files.
    fileInput.value = ''; // Reset the input to allow re-selection of the same file.
  });

  // --- Edit Controls ---

  /**
   * Shows the edit controls and loads the selected image for preview.
   * @param {number} index The index of the selected file in the `files` array.
   */
  function showEditControls(index) {
    selectedFileIndex = index;
    editControls.classList.remove('hidden'); // Show the edit controls.
    const file = files[index];
    loadImageForPreview(file); // Load the image for editing.
  }

  /**
   * Loads an image for preview in the edit canvas.
   * @param {File} file The image file to load.
   */
  function loadImageForPreview(file) {
    const img = new Image();
    img.onload = () => {
      originalImage = img; // Store the original image for editing.

      // Initialize input fields with the image's original dimensions.
      cropWidthInput.value = img.width;
      cropHeightInput.value = img.height;
      resizeWidthInput.value = img.width;
      resizeHeightInput.value = img.height;
      rotateAngleInput.value = 0; // Default rotation.

      updatePreview(); // Initial preview rendering.
    };
    img.onerror = (error) => console.error(`Failed to load image for preview: ${error.message}`);
    img.src = URL.createObjectURL(file); // Create a URL for the image.
  }

  /**
   * Updates the edit preview canvas with the current crop, resize, and rotation settings.
   */
  function updatePreview() {
    if (!originalImage) return; // Ensure an image is loaded.

    // Get values from input fields, defaulting to original image dimensions if invalid.
    const cropWidth = parseInt(cropWidthInput.value, 10) || originalImage.width;
    const cropHeight = parseInt(cropHeightInput.value, 10) || originalImage.height;
    const resizeWidth = parseInt(resizeWidthInput.value, 10) || originalImage.width;
    const resizeHeight = parseInt(resizeHeightInput.value, 10) || originalImage.height;
    const rotateAngle = parseInt(rotateAngleInput.value, 10) || 0;

    // Set canvas dimensions to match the *resized* dimensions.
    editPreview.width = resizeWidth;
    editPreview.height = resizeHeight;
    const ctx = editPreview.getContext('2d');
    ctx.clearRect(0, 0, resizeWidth, resizeHeight); // Clear the canvas.

    // Apply transformations:

    // 1. Rotation: Translate to center, rotate, translate back.
    ctx.translate(resizeWidth / 2, resizeHeight / 2);
    ctx.rotate((rotateAngle * Math.PI) / 180); // Convert degrees to radians.
    ctx.translate(-resizeWidth / 2, -resizeHeight / 2);

    // 2. Crop and Resize: Draw the cropped portion of the original image, resized to the new dimensions.
    try {
      ctx.drawImage(originalImage, 0, 0, cropWidth, cropHeight, 0, 0, resizeWidth, resizeHeight);
    } catch (error) {
      console.error('Error updating preview:', error.message);
    }
  }

  // Add event listeners to the input fields to update the preview live.
  [cropWidthInput, cropHeightInput, resizeWidthInput, resizeHeightInput, rotateAngleInput].forEach(input => {
    input.addEventListener('input', updatePreview);
  });

  // --- Apply Edit Button ---
  applyEditBtn.addEventListener('click', () => {
    if (selectedFileIndex === null) return; // Ensure a file is selected.

    const file = files[selectedFileIndex];
    // Get values from input fields (no defaults here, as they should already be set).
    const cropWidth = parseInt(cropWidthInput.value, 10);
    const cropHeight = parseInt(cropHeightInput.value, 10);
    const resizeWidth = parseInt(resizeWidthInput.value, 10);
    const resizeHeight = parseInt(resizeHeightInput.value, 10);
    const rotateAngle = parseInt(rotateAngleInput.value, 10);

    // Apply the edits and update the file in the `files` array.
    editImage(file, cropWidth, cropHeight, resizeWidth, resizeHeight, rotateAngle).then((editedFile) => {
      files[selectedFileIndex] = editedFile; // Replace the original file with the edited one.
      updatePreviews(); // Update the previews to reflect the changes.
      editControls.classList.add('hidden'); // Hide the edit controls.
      originalImage = null; // Clear the original image.
    }).catch((error) => {
      console.error('Error applying edit:', error.message);
      alert('Failed to apply edit. Please try again.');
    });
  });

  /**
   * Handles the addition of new files to the `files` array.
   * @param {FileList} newFiles The files to add.
   */
  function handleFiles(newFiles) {
    console.log('Handling files:', newFiles);

    // Filter out invalid files (non-images and files exceeding the size limit).
    const validFiles = Array.from(newFiles).filter((file) => {
      if (!file.type.startsWith('image/')) {
        console.log(`Invalid file type for ${file.name}:`, file.type);
        return false; // Reject non-image files.
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.log(`File too large for ${file.name}:`, file.size);
        return false; // Reject files larger than 5MB.
      }
      return true; // Accept valid files.
    });

    if (validFiles.length === 0) {
      console.log('No valid image files');
      alert('Please upload valid image files.'); // No new valid images.
      return;
    }

    files = [...files, ...validFiles]; // Add the new valid files to the existing array.
    console.log('Updated files:', files);
    updatePreviews(); // Update the image previews.
    updateConvertButton(); // Update the state of the convert button.
  }

  /**
   * Updates the image previews in the preview container.
   */
  function updatePreviews() {
    console.log('Updating previews for files:', files);
    previewContainer.innerHTML = ''; // Clear existing previews.

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Preview loaded for file:', file.name);
        // Create preview card elements.
        const previewCard = document.createElement('div');
        previewCard.className = 'preview-card';

        const img = document.createElement('img');
        img.src = e.target.result; // Set the image source to the data URL.
        img.className = 'preview-image';
        img.alt = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×'; // "x" character.
        removeBtn.title = 'Remove image';
        removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
        removeBtn.addEventListener('click', () => {
          console.log('Removing file:', file.name);
          files.splice(index, 1); // Remove the file from the array.
          updatePreviews(); // Update the previews.
          updateConvertButton(); // Update the convert button state.
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = 'Edit';
        editBtn.title = 'Edit image';
        editBtn.setAttribute('aria-label', `Edit ${file.name}`);
        editBtn.addEventListener('click', () => {
          showEditControls(index); // Show edit controls for this image.
        });

        // Assemble the preview card.
        previewCard.appendChild(img);
        previewCard.appendChild(removeBtn);
        previewCard.appendChild(editBtn);
        previewContainer.appendChild(previewCard);
      };
      reader.readAsDataURL(file); // Read the file as a data URL (for preview).
    });
  }

  /**
   * Enables or disables the convert button based on whether files have been uploaded.
   */
  function updateConvertButton() {
    convertBtn.disabled = files.length === 0; // Disable if no files are present.
  }

  /**
   * Edits an image file (crop, resize, rotate).
   * @param {File} file The original image file.
   * @param {number} cropWidth The desired crop width.
   * @param {number} cropHeight The desired crop height.
   * @param {number} resizeWidth The desired resize width.
   * @param {number} resizeHeight The desired resize height.
   * @param {number} rotateAngle The desired rotation angle (in degrees).
   * @returns {Promise<File>} A promise that resolves with the edited image file.
   */
  async function editImage(file, cropWidth, cropHeight, resizeWidth, resizeHeight, rotateAngle) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Apply cropping (if dimensions are provided).
        if (cropWidth && cropHeight) {
          width = Math.min(cropWidth, width); // Don't exceed original dimensions.
          height = Math.min(cropHeight, height);
        }

        // Apply resizing (if dimensions are provided).
        if (resizeWidth && resizeHeight) {
          width = resizeWidth;
          height = resizeHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Apply rotation (if an angle is provided).
        if (rotateAngle) {
          ctx.translate(width / 2, height / 2);
          ctx.rotate((rotateAngle * Math.PI) / 180); // Convert to radians.
          ctx.translate(-width / 2, -height / 2);
        }

        try {
          // Draw the (potentially cropped and rotated) image onto the canvas.
          ctx.drawImage(img, 0, 0, width, height);

          // Convert the canvas content to a Blob, then to a File.
          canvas.toBlob((blob) => {
            const editedFile = new File([blob], file.name, { type: file.type });
            resolve(editedFile); // Resolve the promise with the new File object.
          }, file.type);
        } catch (error) {
          reject(error); // Reject the promise if drawing fails.
        }
      };
      img.onerror = (error) => reject(new Error(`Failed to load image for editing: ${error.message}`));
      img.src = URL.createObjectURL(file); // Load the image from a URL.
    });
  }
}

/**
 * Returns the array of currently uploaded files.
 * @returns {Array<File>} The array of files.
 */
export function getFiles() {
  return files;
}