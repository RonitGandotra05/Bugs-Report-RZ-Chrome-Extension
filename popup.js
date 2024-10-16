document.getElementById('screenshot-btn').addEventListener('click', function() {
  const description = document.getElementById('description').value;
  const recipient = document.getElementById('recipient').value;

  chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
    uploadToServer(dataUrl, description, recipient);
  });
});

function uploadToServer(dataUrl, description, recipient) {
  // Convert dataUrl to Blob
  const blob = dataURLtoBlob(dataUrl);

  // Create FormData and append the image file, description, and recipient
  const formData = new FormData();
  formData.append('file', blob, 'screenshot.png');
  formData.append('description', description);
  formData.append('recipient', recipient);

  fetch('http://localhost:8000/upload', {  // Replace with your server URL if different
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
    alert('Screenshot, description, and recipient uploaded successfully.');
  })
  .catch((error) => {
    console.error('Error:', error);
    alert('Error uploading screenshot: ' + error.message);
  });
}

// Helper function to convert dataURL to Blob
function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type: mime});
}
