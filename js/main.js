// Import necessary modules from other files.
import { initFileUpload, getFiles } from './ui/file-upload.js';
import { batchConvert } from './conversion/converter.js';
import { downloadConvertedFiles } from './utils/zip.js';

// Wait for the DOM to be fully loaded before running the main logic.
document.addEventListener('DOMContentLoaded', () => {
  // Log a message to the console to indicate that main.js has loaded.
  console.log('Main.js loaded');

  // Initialize the file upload functionality (drag-and-drop and file input).
  initFileUpload();

  // Get references to DOM elements.
  const convertBtn = document.getElementById('convert-btn');
  const formatSelect = document.getElementById('format-select');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  // Add a click event listener to the convert button.
  convertBtn.addEventListener('click', async () => {
    // Log a message when the button is clicked.
    console.log('Convert button clicked');

    // Get the currently selected files and the desired output format.
    const files = getFiles();
    const outputFormat = formatSelect.value;

    // Check if any files have been uploaded.  If not, show an alert and return.
    if (files.length === 0) {
      alert('Please upload files to convert.');
      return;
    }

    // Show the progress bar and initialize its state.
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = 'Processing: 0%';

    try {
      // Perform the batch conversion of the images.
      const convertedFiles = await batchConvert(files, outputFormat, 85, (progress, completed, total) => {
        // Update the progress bar during the conversion process.
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        progressText.textContent = `Processing: ${Math.round(progress)}% (${completed}/${total} files)`;
      });

      // Log the converted files to the console (for debugging).
      console.log('Converted files:', convertedFiles);

      // Hide the progress bar after conversion is complete.
      progressContainer.classList.add('hidden');

      // Initiate the download of the converted files as a ZIP archive.
      await downloadConvertedFiles(convertedFiles);

    } catch (error) {
      // Handle any errors that occur during the conversion process.
      console.error('Conversion failed:', error.message);
      alert('Conversion failed. Please try again.');
      progressContainer.classList.add('hidden'); // Hide progress bar on error
    }
  });
});