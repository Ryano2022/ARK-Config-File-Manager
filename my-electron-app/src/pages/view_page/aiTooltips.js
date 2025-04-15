const tooltipCache = {};

export async function getAITooltip(key) {
  // Check cache first.
  if (tooltipCache[key]) {
    return tooltipCache[key];
  }

  try {
    const tooltip = await window.electronAPI.generateAITooltip(key);

    if (tooltip) {
      // Cache the result.
      tooltipCache[key] = tooltip;
      return tooltip;
    }
  } catch (error) {
    console.error(`Error getting AI tooltip for ${key}:`, error);
    return null;
  }
}
