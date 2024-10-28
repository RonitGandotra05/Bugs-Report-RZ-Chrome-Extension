document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login-btn');

  const uploadForm = document.getElementById('upload-form');
  const logoutButton = document.getElementById('logout-btn');
  const mediaDropZone = document.getElementById('media-drop-zone');
  const uploadButton = document.getElementById('upload-btn');
  const loader = document.getElementById('loader');

  let clipboardDataUrl = null;
  let mediaType = null; // 'image' or 'video'
  let accessToken = null;

  // Recipient name to email and phone number mapping
  const recipientDataMap = {
    "Ronit": { email: "ronit@example.com", phone: "919999999999" },
    "Kapil": { email: "kapil@example.com", phone: "919888888888" },
    "Yash": { email: "yash@example.com", phone: "919777777777" },
    "Saurabh": { email: "saurabh@example.com", phone: "919666666666" },
    "Sandeep Yadav": { email: "sandeep.yadav@example.com", phone: "919555555555" },
    "Shubham Sachdeva": { email: "shubham.sachdeva@example.com", phone: "919444444444" },
    "Piyush Suneja": { email: "piyush.suneja@example.com", phone: "919333333333" },
    "Yash Kumar Pal": { email: "yash.kumar.pal@example.com", phone: "919222222222" },
    "Kapil Sharma": { email: "kapil.sharma@example.com", phone: "919111111111" },
    "Arun Kumar": { email: "arun.kumar@example.com", phone: "919000000000" },
    "Rohan Thakur": { email: "rohan.thakur@example.com", phone: "918999999999" },
    "Subhashish Behera": { email: "subhashish.behera@example.com", phone: "918888888888" },
    "Boby": { email: "boby@example.com", phone: "918777777777" },
    "Ankita Singh": { email: "ankita.singh@example.com", phone: "918666666666" },
    "CP Dhaundiyal": { email: "cp.dhaundiyal@example.com", phone: "918555555555" },
    "Sajal": { email: "sajal@example.com", phone: "918444444444" },
    "Ryan": { email: "ryan@example.com", phone: "918333333333" },
    "Karan Grover": { email: "karan.grover@example.com", phone: "918222222222" },
    "Karan Sachdeva": { email: "karan.sachdeva@example.com", phone: "918111111111" },
    "Vikas Singh": { email: "vikas.singh@example.com", phone: "918000000000" },
    "None": { email: "none@example.com", phone: null }
  };

  // UltraMsg API credentials (Replace with your actual credentials)
  const ULTRAMSG_INSTANCE_ID = 'YOUR_INSTANCE_ID'; // e.g., 'instance12345'
  const ULTRAMSG_TOKEN = 'YOUR_ULTRAMSG_TOKEN'; // e.g., 'abc123def456'

  // Check if user is already logged in
  accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    showUploadForm();
  } else {
    showLoginForm();
  }

  // Event listener for login button
  loginButton.addEventListener('click', function() {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    showLoader(); // Show loader when login starts

    loginUser(email, password);
  });

  function loginUser(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    fetch('https://bugapi.tripxap.com/login', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.detail || 'Login failed');
        });
      }
      return response.json();
    })
    .then(data => {
      accessToken = data.access_token;
      localStorage.setItem('accessToken', accessToken);
      hideLoader(); // Hide loader after successful login
      showUploadForm();
    })
    .catch(error => {
      console.error('Error:', error);
      hideLoader(); // Hide loader on error
      alert('Login failed: ' + error.message);
    });
  }

  function showLoginForm() {
    loginForm.style.display = 'block';
    uploadForm.style.display = 'none';
  }

  function showUploadForm() {
    loginForm.style.display = 'none';
    uploadForm.style.display = 'block';
  }

  // Logout functionality
  logoutButton.addEventListener('click', function() {
    logoutUser();
  });

  function logoutUser() {
    fetch('https://bugapi.tripxap.com/logout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      accessToken = null;
      localStorage.removeItem('accessToken');
      showLoginForm();
    })
    .catch(error => {
      console.error('Error:', error);
      accessToken = null;
      localStorage.removeItem('accessToken');
      showLoginForm();
    });
  }

  // Drag and Drop Functionality
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    mediaDropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop area when item is dragged over it
  mediaDropZone.addEventListener('dragenter', () => mediaDropZone.classList.add('highlight'), false);
  mediaDropZone.addEventListener('dragover', () => mediaDropZone.classList.add('highlight'), false);
  mediaDropZone.addEventListener('dragleave', () => mediaDropZone.classList.remove('highlight'), false);
  mediaDropZone.addEventListener('drop', () => mediaDropZone.classList.remove('highlight'), false);

  // Handle dropped files
  mediaDropZone.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];
      if (file.type.indexOf('image') !== -1) {
        mediaType = 'image';
      } else if (file.type.indexOf('video') !== -1) {
        mediaType = 'video';
      } else {
        alert('Please drop a valid image or video file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        clipboardDataUrl = e.target.result;
        displayMediaPreview(clipboardDataUrl, mediaType);
      };
      reader.readAsDataURL(file);
    }
  }

  // Copy-Paste Functionality
  document.addEventListener('paste', (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        mediaType = 'image';
        const reader = new FileReader();
        reader.onload = function(e) {
          clipboardDataUrl = e.target.result;
          displayMediaPreview(clipboardDataUrl, mediaType);
        };
        reader.readAsDataURL(blob);
        break;
      } else if (item.type.indexOf('video') !== -1) {
        const blob = item.getAsFile();
        mediaType = 'video';
        const reader = new FileReader();
        reader.onload = function(e) {
          clipboardDataUrl = e.target.result;
          displayMediaPreview(clipboardDataUrl, mediaType);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  });

  // Function to display media preview
  function displayMediaPreview(dataUrl, type) {
    mediaDropZone.innerHTML = ''; // Clear previous content
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = dataUrl;
      mediaDropZone.appendChild(img);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = dataUrl;
      video.controls = true;
      mediaDropZone.appendChild(video);
    }
  }

  // Upload the pasted or dropped media, description, and recipient
  uploadButton.addEventListener('click', function() {
    const description = document.getElementById('description').value;
    const recipientName = document.getElementById('recipient').value;

    if (!clipboardDataUrl) {
      alert('Please paste or drop an image or video before uploading.');
      return;
    }

    if (!recipientName) {
      alert('Please select a recipient.');
      return;
    }

    const recipientData = recipientDataMap[recipientName];

    if (!recipientData) {
      alert('Recipient data not found for the selected name.');
      return;
    }

    showLoader(); // Show loader during upload

    uploadToServer(clipboardDataUrl, description, recipientData.email, mediaType)
      .then(responseData => {
        hideLoader(); // Hide loader after upload completes
        alert('Media, description, and recipient uploaded successfully.');
        resetForm();

        // Send WhatsApp message if recipient is not "None"
        if (recipientName !== "None" && recipientData.phone) {
          sendWhatsAppMessage(recipientData.phone, responseData.url, description, mediaType);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        hideLoader(); // Hide loader on error
        alert('Error uploading media: ' + error.message);
      });
  });

  function uploadToServer(dataUrl, description, recipientEmail, type) {
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append('file', blob, type === 'image' ? 'image.png' : 'video.mp4');
    formData.append('description', description);
    formData.append('recipient_email', recipientEmail);

    return fetch('https://bugapi.tripxap.com/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.detail || 'Upload failed');
        });
      }
      return response.json();
    });
  }

  function sendWhatsAppMessage(phoneNumber, mediaLink, caption, type) {
    let url, payload;
    if (type === 'image') {
      url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/image`;
      payload = {
        token: ULTRAMSG_TOKEN,
        to: phoneNumber + "@c.us",
        image: mediaLink,
        caption: "Hi, the following bug has been found:\n" + caption
      };
    } else if (type === 'video') {
      url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/video`;
      payload = {
        token: ULTRAMSG_TOKEN,
        to: phoneNumber + "@c.us",
        video: mediaLink,
        caption: "Hi, the following bug has been found:\n" + caption
      };
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.info || 'WhatsApp message failed');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('WhatsApp message sent:', data);
    })
    .catch(error => {
      console.error('Error sending WhatsApp message:', error);
      // Decide whether to alert the user or silently fail
    });
  }

  // Helper function to convert dataURL to Blob
  function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Reset the form after successful upload
  function resetForm() {
    clipboardDataUrl = null;
    mediaType = null;
    mediaDropZone.innerHTML = 'Drag and drop your media here or paste from clipboard';
    document.getElementById('description').value = '';
    document.getElementById('recipient').selectedIndex = 0;
  }

  // Loader control functions
  function showLoader() {
    loader.style.display = 'flex';
  }

  function hideLoader() {
    loader.style.display = 'none';
  }
});
