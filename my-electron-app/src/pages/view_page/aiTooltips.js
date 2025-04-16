export const tooltipCache = {};
const pendingRequests = {};

export async function getAITooltip(key) {
  // Check cache first.
  if (tooltipCache[key]) {
    return tooltipCache[key];
  }

  if (pendingRequests[key]) {
    return pendingRequests[key];
  }

  try {
    // Store the promise in pendingRequests before awaiting.
    pendingRequests[key] = window.electronAPI.generateAITooltip(key);
    const tooltip = await pendingRequests[key];

    if (tooltip) {
      // Cache the result.
      tooltipCache[key] = tooltip;
      return tooltip;
    }
  } catch (error) {
    console.error(`Error getting AI tooltip for ${key}:`, error);
    return null;
  } finally {
    delete pendingRequests[key];
  }
}
