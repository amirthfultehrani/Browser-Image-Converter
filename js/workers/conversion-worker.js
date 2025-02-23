// Listen for messages from the main thread.
self.addEventListener('message', async (e) => {
    const { file, outputFormat, quality } = e.data;
  
    try {
      // Log file details for debugging.
      console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
  
      // Load the image using createImageBitmap, which is efficient in Web Workers.
      const bitmap = await createImageBitmap(file);
      console.log('Image bitmap loaded successfully:', bitmap.width, 'x', bitmap.height);
  
      // Create an OffscreenCanvas for drawing and manipulation.
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close(); // Release bitmap resources to free memory.
  
      console.log('Image drawn on canvas:', canvas.width, 'x', canvas.height);
  
      // Determine the MIME type based on the desired output format.
      const mimeType = `image/${outputFormat.toLowerCase()}`;
      console.log('Using MIME type:', mimeType);
  
      // Implement an iterative compression optimization strategy.
      // Start with the given quality and reduce it if the file size is too large.
      let targetQuality = quality / 100;
      let blob;
      let size;
      let attempts = 0;
      const maxAttempts = 5; // Limit the number of compression attempts.
      const targetSize = file.size * 0.5; // Aim for 50% reduction in file size.
  
      do {
        console.log(`Attempt ${attempts + 1}: Converting with quality ${targetQuality}`);
        // Convert the canvas content to a Blob with the specified MIME type and quality.
        blob = await canvas.convertToBlob({ type: mimeType, quality: targetQuality });
        size = blob.size;
        console.log(`Blob size after attempt ${attempts + 1}:`, size, 'bytes');
  
        // Check for an empty blob, indicating a critical failure.
          if (size === 0) {
            throw new Error('Generated blob is empty (0 bytes)');
          }
  
        // If the blob size is larger than the target and we haven't reached the max attempts,
        // reduce the quality and try again.
        if (size > targetSize && attempts < maxAttempts) {
          targetQuality *= 0.8; // Reduce quality by 20% for the next attempt.
          attempts++;
        } else {
          break; // Exit loop if size is acceptable or max attempts reached.
        }
      } while (attempts < maxAttempts);
  
  
        if (size === 0) {
          throw new Error('Final blob is empty (0 bytes) after all attempts');
        }
  
      // Convert the Blob to an ArrayBuffer for efficient transfer to the main thread.
      const arrayBuffer = await blob.arrayBuffer();
      console.log('Array buffer size:', arrayBuffer.byteLength, 'bytes');
  
      // Check array buffer to see if its empty.
      if (arrayBuffer.byteLength === 0) {
          throw new Error('Array buffer is empty (0 bytes)');
        }
  
      // Post the result back to the main thread.  Transfer the ArrayBuffer to avoid copying.
      self.postMessage({
        name: file.name.replace(/\.[^/.]+$/, `.${outputFormat.toLowerCase()}`), // Create new file name
        arrayBuffer: arrayBuffer,
        mimeType: mimeType,
      }, [arrayBuffer]); // Transfer ownership of the ArrayBuffer.
    } catch (error) {
      // Handle any errors that occur during the process and send an error message back.
      console.error('Worker error:', error.message);
      self.postMessage({ error: error.message });
    }
  });