document.getElementById('takeScreenshot').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      alert('No active tab found.');
      return;
    }

    chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error('Error capturing tab:', chrome.runtime.lastError);
        alert('Failed to capture screenshot.');
        return;
      }

      chrome.runtime.sendMessage({ action: 'uploadToDrive', dataUrl });
    });
  });
});
