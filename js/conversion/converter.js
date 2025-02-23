/**
 * Converts a single image file to the specified format using a Web Worker.
 *
 * @param {File} file The image file to convert.
 * @param {string} outputFormat The desired output format (e.g., "JPEG", "PNG").
 * @param {number} [quality=85] The quality setting for image formats that support it (0-100).
 * @param {function} onProgress callback function to show the progress.
 * @returns {Promise<Object>} A promise that resolves with the converted image data (name, arrayBuffer, mimeType).
 */
export async function convertImage(file, outputFormat, quality = 85, onProgress) {
    return new Promise((resolve, reject) => {
      // Create a new Web Worker.  The path is relative to the *HTML* file, not the JS file.
      const worker = new Worker('./js/workers/conversion-worker.js');
  
      // Send the file, output format, and quality to the worker.
      worker.postMessage({ file, outputFormat, quality });
  
      // Handle messages from the worker.
      worker.onmessage = (e) => {
        if (e.data.error) {
          // If the worker sends an error, reject the promise.
          console.error(`Error converting ${file.name}:`, e.data.error);
          reject(new Error(e.data.error));
        } else {
          // If the worker sends data, resolve the promise with the converted image data.
          console.log(`Conversion successful for ${file.name}`);
          resolve(e.data);
        }
        worker.terminate(); // Terminate the worker after it completes.
      };
  
      // Handle errors from the worker itself (e.g., if the worker script fails to load).
      worker.onerror = (error) => {
        console.error(`Worker error for ${file.name}:`, error.message);
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate(); // Terminate the worker in case of an error.
      };
    });
  }
  
  /**
   * Converts multiple image files to the specified format.
   *
   * @param {Array<File>} files An array of image files to convert.
   * @param {string} outputFormat The desired output format (e.g., "JPEG", "PNG").
   * @param {number} [quality=85] The quality setting (0-100).
   * @param {function} onProgress A callback function that receives progress updates (percentage, completed count, total count).
   * @returns {Promise<Array<Object>>} A promise that resolves with an array of converted image data objects.
   */
  export async function batchConvert(files, outputFormat, quality = 85, onProgress) {
    console.log(`Starting batch conversion for ${files.length} files`);
    const results = []; // Array to store the converted image data.
    let completed = 0; // Counter for completed conversions.
  
    // Iterate through the files and convert each one.
    for (const file of files) {
      try {
        // Convert the image using the `convertImage` function.
        const result = await convertImage(file, outputFormat, quality);
        results.push(result); // Add the result to the array.
        completed++; // Increment the completed counter.
  
        // Calculate and report progress.
        const progress = (completed / files.length) * 100;
        if (onProgress) {
          onProgress(progress, completed, files.length); // Call the progress callback.
        }
      } catch (error) {
        // Handle errors during conversion (e.g., skip the file).
        console.error(`Skipping ${file.name} due to conversion error:`, error.message);
        completed++; // Increment completed even if a file fails (to maintain accurate progress).
         const progress = (completed / files.length) * 100;
          if (onProgress) {
            onProgress(progress, completed, files.length);
          }
        continue; // Skip to the next file.
      }
    }
  
    console.log('Batch conversion completed', results.length, 'files converted successfully');
    return results; // Return the array of converted image data.
  }