// Background service worker for Course Planning Assistant

console.log('Course Planning Assistant: Background service worker loaded');

let screenshotInterval = null;
let lastScreenshot = null;
let screenshotEnabled = false;

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Check if the tab is on enroll.wisc.edu
  if (tab.url && tab.url.includes('enroll.wisc.edu')) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
    // Open side panel anyway, but it will show a message
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Enable side panel for enroll.wisc.edu pages
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;

  if (tab.url.includes('enroll.wisc.edu')) {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: true
    });
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Course Planning Assistant installed!');
  } else if (details.reason === 'update') {
    console.log('Course Planning Assistant updated!');
  }
});

// Capture screenshot of active tab
async function captureScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || !tab.url.includes('enroll.wisc.edu')) {
      return null;
    }

    // Capture the visible tab as a data URL
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });

    lastScreenshot = dataUrl;

    // Notify side panel of new screenshot
    chrome.runtime.sendMessage({
      action: 'screenshotCaptured',
      screenshot: dataUrl
    }).catch(() => {
      // Ignore errors if side panel is not open
    });

    return dataUrl;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null;
  }
}

// Start periodic screenshot capture
function startScreenshotCapture(interval = 5000) {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }

  screenshotEnabled = true;

  // Capture immediately
  captureScreenshot();

  // Then capture at regular intervals
  screenshotInterval = setInterval(captureScreenshot, interval);
  console.log(`Screenshot capture started (every ${interval}ms)`);
}

// Stop periodic screenshot capture
function stopScreenshotCapture() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  screenshotEnabled = false;
  console.log('Screenshot capture stopped');
}

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'courseDataUpdated') {
    // Forward to side panel (kept for compatibility)
    return false;
  }

  if (message.action === 'startScreenshotCapture') {
    startScreenshotCapture(message.interval || 5000);
    sendResponse({ success: true, enabled: true });
    return false;
  }

  if (message.action === 'stopScreenshotCapture') {
    stopScreenshotCapture();
    sendResponse({ success: true, enabled: false });
    return false;
  }

  if (message.action === 'getLatestScreenshot') {
    sendResponse({ screenshot: lastScreenshot });
    return false;
  }

  if (message.action === 'captureNow') {
    captureScreenshot().then(screenshot => {
      sendResponse({ screenshot });
    });
    return true; // Keep channel open for async response
  }

  return false;
});