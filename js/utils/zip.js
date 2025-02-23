// Create a cache to store URLs of created blobs (optional, for potential reuse).
const cache = new Map();

/**
 * Downloads converted files.  Handles single files directly and multiple files as a ZIP archive.
 * @param {Array<Object>} convertedFiles An array of objects, each containing `name`, `arrayBuffer`, and `mimeType`.
 */
export async function downloadConvertedFiles(convertedFiles) {
  console.log('Downloading converted files:', convertedFiles);

  if (convertedFiles.length === 1) {
    // Handle single file download.
    const file = convertedFiles[0];
    try {
      // Create a Blob from the ArrayBuffer.
      const blob = new Blob([file.arrayBuffer], { type: file.mimeType });
      console.log(`Single file blob size for ${file.name}:`, blob.size, 'bytes');

       // Check if the blob is empty and handle the error appropriately
      if (blob.size === 0) {
        throw new Error(`Blob for ${file.name} is empty (0 bytes)`);
      }


      // Create a temporary URL for the Blob.
      const url = URL.createObjectURL(blob);

      // Create a download link, simulate a click, and then remove the link.
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL to free resources.
      URL.revokeObjectURL(url);
      console.log(`Downloaded single file ${file.name}`);

      // Cache the URL (optional).
      cache.set(file.name, url);
    } catch (error) {
      console.error(`Error downloading single file ${file.name}:`, error.message);
      alert(`Failed to download ${file.name}. Please try again.`);
    }
  } else {
    // Handle multiple files by creating a ZIP archive.
    const zip = new JSZip(); // Create a new JSZip instance.
    try {
      // Process each converted file.
      for (const file of convertedFiles) {
        // Create a Blob from the ArrayBuffer.
        const blob = new Blob([file.arrayBuffer], { type: file.mimeType });
        console.log(`Blob size for ${file.name} in ZIP:`, blob.size, 'bytes');

          //Check to make sure that the blob isn't empty
        if (blob.size === 0) {
          console.error(`Blob for ${file.name} is empty (0 bytes)`);
          continue; // Skip empty files, prevent them being added to zip
        }


        // Add the file to the ZIP archive.
        zip.file(file.name, file.arrayBuffer);

        // Cache the object URL (optional).
        cache.set(file.name, URL.createObjectURL(blob));
      }

      // Generate the ZIP archive as a Blob.
      const blob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIP blob size:', blob.size, 'bytes');

       // Check to see if for some reason the blob is zero
      if (blob.size === 0) {
        throw new Error('Generated ZIP blob is empty (0 bytes)');
      }

      // Create a download link for the ZIP archive.
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images.zip'; // Set a default ZIP file name.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL to free resources.
      URL.revokeObjectURL(url);
      console.log('Downloaded ZIP archive');
    } catch (error) {
      console.error('Error generating ZIP:', error.message);
      alert('Failed to generate ZIP archive. Please try again.');
    }
  }
}