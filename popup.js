document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login-btn');
  const showPasswordCheckbox = document.getElementById('show-password'); // Show Password Checkbox

  const uploadForm = document.getElementById('upload-form');
  const logoutButton = document.getElementById('logout-btn');
  const mediaDropZone = document.getElementById('media-drop-zone');
  const uploadButton = document.getElementById('upload-btn');
  const loader = document.getElementById('loader');
  const recipientSelect = document.getElementById('recipient');

  let clipboardDataUrl = null;
  let mediaType = null; // 'image' or 'video'
  let accessToken = null;

  // FastAPI Endpoint (Replace with your actual FastAPI upload endpoint)
  const FASTAPI_UPLOAD_ENDPOINT = 'https://bugapi.tripxap.com/upload'; // e.g., 'https://api.yourdomain.com/upload'

  // Check if user is already logged in
  accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    showUploadForm();
    fetchRegisteredUsers();
  } else {
    showLoginForm();
  }

  // Event listener for login button
  loginButton.addEventListener('click', function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    showLoader(); // Show loader during login

    loginUser(email, password);
  });

  // Event listener for Show Password checkbox
  showPasswordCheckbox.addEventListener('change', function() {
    if (this.checked) {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  });

  function loginUser(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    fetch('https://bugapi.tripxap.com/login', { // Replace with your FastAPI login endpoint if different
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
      fetchRegisteredUsers(); // Fetch users after login
    })
    .catch(error => {
      console.error('Login Error:', error);
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
    fetch('https://bugapi.tripxap.com/logout', { // Replace with your FastAPI logout endpoint if different
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      if (response.ok) {
        localStorage.removeItem('accessToken');
        accessToken = null;
        showLoginForm();
        resetRecipientDropdown();
      } else {
        throw new Error('Logout failed');
      }
    })
    .catch(error => {
      console.error('Logout Error:', error);
      localStorage.removeItem('accessToken');
      accessToken = null;
      showLoginForm();
      resetRecipientDropdown();
    });
  }

  // Fetch registered users from FastAPI
  function fetchRegisteredUsers() {
    fetch('https://bugapi.tripxap.com/users', { // Replace with your FastAPI /users endpoint if different
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    })
    .then(userList => {
      populateRecipientDropdown(userList);
    })
    .catch(error => {
      console.error('Fetch Users Error:', error);
      alert('Failed to fetch registered users.');
    });
  }

  // Populate the recipient dropdown with fetched users
  function populateRecipientDropdown(users) {
    // Clear existing options except the first one ("Select a recipient") and "None"
    while (recipientSelect.options.length > 2) { // Assuming first option is prompt and second is "None"
      recipientSelect.remove(2);
    }

    // Add users to the dropdown
    users.forEach(userName => {
      const option = document.createElement('option');
      option.value = userName;
      option.text = userName;
      recipientSelect.add(option);
    });
  }

  // Reset recipient dropdown to default state
  function resetRecipientDropdown() {
    // Remove all options except the first one ("Select a recipient") and "None"
    while (recipientSelect.options.length > 2) { // Assuming first option is prompt and second is "None"
      recipientSelect.remove(2);
    }
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
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
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
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        mediaType = 'image';
        const reader = new FileReader();
        reader.onload = function(e) {
          clipboardDataUrl = e.target.result;
          displayMediaPreview(clipboardDataUrl, mediaType);
        };
        reader.readAsDataURL(blob);
        break;
      } else if (item.type.startsWith('video/')) {
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
    const description = document.getElementById('description').value.trim();
    const recipientName = recipientSelect.value;

    if (!clipboardDataUrl) {
      alert('Please paste or drop an image or video before uploading.');
      return;
    }

    if (!recipientName) {
      alert('Please select a recipient.');
      return;
    }

    showLoader(); // Show loader during upload

    uploadToServer(clipboardDataUrl, description, recipientName, mediaType)
      .then(responseData => {
        hideLoader(); // Hide loader after upload completes
        alert('Media and description uploaded successfully.');
        resetForm();
      })
      .catch(error => {
        console.error('Upload Error:', error);
        hideLoader(); // Hide loader on error
        alert('Error uploading media: ' + error.message);
      });
  });

  function uploadToServer(dataUrl, description, recipientName, type) {
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append('file', blob, type === 'image' ? 'image.png' : 'video.mp4');
    formData.append('description', description);
    formData.append('recipient_name', recipientName !== "None" ? recipientName : null);

    return fetch(FASTAPI_UPLOAD_ENDPOINT, { // Ensure CORS is handled on the FastAPI server
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken // If your FastAPI endpoint requires authentication
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

  // Helper function to convert dataURL to Blob
  function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : '';
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
    recipientSelect.selectedIndex = 0;
  }

  // Loader control functions
  function showLoader() {
    loader.style.display = 'flex';
  }

  function hideLoader() {
    loader.style.display = 'none';
  }
});