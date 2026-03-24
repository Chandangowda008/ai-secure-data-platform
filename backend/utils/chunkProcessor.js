const defaultChunkSize = 500;

export async function processInChunks(items, processChunk, chunkSize = defaultChunkSize) {
  for (let index = 0; index < items.length; index += chunkSize) {
    const chunk = items.slice(index, index + chunkSize);
    await processChunk(chunk, index);

    // Yield to the event loop between chunks for better responsiveness on large logs.
    await new Promise((resolve) => setImmediate(resolve));
  }
}
