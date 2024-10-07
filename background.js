chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadToDrive') {
    uploadToGoogleDrive(message.dataUrl);
  }
});

function uploadToGoogleDrive(dataUrl) {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const contentType = 'image/png';
  const metadata = {
    name: `Screenshot_${new Date().toISOString()}.png`,
    mimeType: contentType
  };

  const base64Data = dataUrl.split(',')[1];
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + contentType + '\r\n' +
    'Content-Transfer-Encoding: base64\r\n' +
    '\r\n' +
    base64Data +
    closeDelimiter;

  getAccessToken().then((accessToken) => {
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
      body: multipartRequestBody
    }).then(response => {
      if (response.ok) {
        response.json().then(data => {
          console.log('File uploaded successfully', data);
          notifyUser('Screenshot uploaded successfully!');
        });
      } else {
        response.json().then(error => {
          console.error('Error uploading file:', error);
          notifyUser('Error uploading screenshot: ' + error.message);
        });
      }
    }).catch(error => {
      console.error('Fetch error:', error);
      notifyUser('Fetch error: ' + error.message);
    });
  }).catch(error => {
    console.error('Error getting access token:', error);
    notifyUser('Authentication error: ' + error.message);
  });
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError || new Error('Failed to get token'));
      } else {
        resolve(token);
      }
    });
  });
}

function notifyUser(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Screenshot to Google Drive',
    message: message
  });
}
