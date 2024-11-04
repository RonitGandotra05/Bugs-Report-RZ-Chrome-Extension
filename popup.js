document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login-btn');
  const showPasswordCheckbox = document.getElementById('show-password');

  const forgotPasswordButton = document.getElementById('forgot-password-btn');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const forgotEmailInput = document.getElementById('forgot-email');
  const sendOtpButton = document.getElementById('send-otp-btn');
  const backToLoginButton = document.getElementById('back-to-login-btn');

  const otpVerificationForm = document.getElementById('otp-verification-form');
  const otpInput = document.getElementById('otp-input');
  const newPasswordInput = document.getElementById('new-password');
  const showNewPasswordCheckbox = document.getElementById('show-new-password');
  const resetPasswordButton = document.getElementById('reset-password-btn');
  const backToForgotButton = document.getElementById('back-to-forgot-btn');

  const uploadForm = document.getElementById('upload-form');
  const logoutButton = document.getElementById('logout-btn');
  const mediaDropZone = document.getElementById('media-drop-zone');
  const uploadButton = document.getElementById('upload-btn');
  const loader = document.getElementById('loader');
  const recipientSelect = document.getElementById('recipient');
  const descriptionInput = document.getElementById('description');
  const dashboardButton = document.getElementById('dashboard-btn'); // Dashboard button

  let clipboardDataUrl = null;
  let mediaType = null; // 'image' or 'video'
  let accessToken = null;
  let resetEmail = null; // Stores email during password reset flow

  // FastAPI Endpoint (Replace with your actual FastAPI backend URL)
  const API_BASE_URL = 'https://bugapi.tripxap.com';

  // Check if user is already logged in
  accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    showForm(uploadForm);
    fetchRegisteredUsers();
  } else {
    showForm(loginForm);
  }

  // Event Listeners for Login Form
  loginButton.addEventListener('click', function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    showLoader();
    loginUser(email, password);
  });

  showPasswordCheckbox.addEventListener('change', function() {
    passwordInput.type = this.checked ? 'text' : 'password';
  });

  // Event Listener for Forgot Password Button
  forgotPasswordButton.addEventListener('click', function() {
    showForm(forgotPasswordForm);
  });

  // Event Listeners for Forgot Password Form
  sendOtpButton.addEventListener('click', handleSendOtp);
  backToLoginButton.addEventListener('click', function() {
    showForm(loginForm);
  });

  // Event Listeners for OTP Verification Form
  resetPasswordButton.addEventListener('click', handleResetPassword);
  backToForgotButton.addEventListener('click', function() {
    showForm(forgotPasswordForm);
  });

  showNewPasswordCheckbox.addEventListener('change', function() {
    newPasswordInput.type = this.checked ? 'text' : 'password';
  });

  // Logout functionality
  logoutButton.addEventListener('click', function() {
    logoutUser();
  });

  // Event Listener for Dashboard Button
  dashboardButton.addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://exquisite-tarsier-27371d.netlify.app/' });
  });

  // Event Listeners for Media Upload
  uploadButton.addEventListener('click', handleUpload);

  // Drag and Drop Functionality
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    mediaDropZone.addEventListener(eventName, preventDefaults, false);
  });

  mediaDropZone.addEventListener('dragenter', () => mediaDropZone.classList.add('highlight'), false);
  mediaDropZone.addEventListener('dragover', () => mediaDropZone.classList.add('highlight'), false);
  mediaDropZone.addEventListener('dragleave', () => mediaDropZone.classList.remove('highlight'), false);
  mediaDropZone.addEventListener('drop', () => mediaDropZone.classList.remove('highlight'), false);

  mediaDropZone.addEventListener('drop', handleDrop, false);

  // Clipboard Paste Functionality
  document.addEventListener('paste', handlePaste);

  // Functions

  function showForm(form) {
    // Hide all forms
    [loginForm, forgotPasswordForm, otpVerificationForm, uploadForm].forEach(f => f.classList.remove('active'));
    // Show the selected form
    form.classList.add('active');
  }

  function showLoader() {
    loader.style.display = 'flex';
  }

  function hideLoader() {
    loader.style.display = 'none';
  }

  function loginUser(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    fetch(`${API_BASE_URL}/login`, {
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
      hideLoader();
      showForm(uploadForm);
      fetchRegisteredUsers();
    })
    .catch(error => {
      console.error('Login Error:', error);
      hideLoader();
      alert('Login failed: ' + error.message);
    });
  }

  function logoutUser() {
    fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      localStorage.removeItem('accessToken');
      accessToken = null;
      showForm(loginForm);
      resetRecipientDropdown();
    })
    .catch(error => {
      console.error('Logout Error:', error);
      localStorage.removeItem('accessToken');
      accessToken = null;
      showForm(loginForm);
      resetRecipientDropdown();
    });
  }

  function fetchRegisteredUsers() {
    fetch(`${API_BASE_URL}/users`, {
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

  function populateRecipientDropdown(users) {
    // Clear existing options except the first two
    while (recipientSelect.options.length > 2) {
      recipientSelect.remove(2);
    }
    users.forEach(userName => {
      const option = document.createElement('option');
      option.value = userName;
      option.text = userName;
      recipientSelect.add(option);
    });
    // Ensure 'None' remains selected after populating
    recipientSelect.value = "None";
  }

  function resetRecipientDropdown() {
    // Remove all options except the first two
    while (recipientSelect.options.length > 2) {
      recipientSelect.remove(2);
    }
    // Set recipient to 'None' by default
    recipientSelect.value = "None";
  }

  function handleSendOtp() {
    const email = forgotEmailInput.value.trim();
    if (!email) {
      alert('Please enter your email.');
      return;
    }
    showLoader();
    const formData = new FormData();
    formData.append('email', email);

    fetch(`${API_BASE_URL}/forgot_password`, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      hideLoader();
      alert(data.message);
      if (data.message.includes('OTP')) {
        resetEmail = email; // Store the email for use in reset
        showForm(otpVerificationForm);
      }
    })
    .catch(error => {
      console.error('Error sending OTP:', error);
      hideLoader();
      alert('Error sending OTP. Please try again.');
    });
  }

  function handleResetPassword() {
    const otp = otpInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    if (!otp || !newPassword) {
      alert('Please enter the OTP and new password.');
      return;
    }
    showLoader();
    const formData = new FormData();
    formData.append('email', resetEmail);
    formData.append('otp', otp);
    formData.append('new_password', newPassword);

    fetch(`${API_BASE_URL}/reset_password`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.detail || 'Reset password failed');
        });
      }
      return response.json();
    })
    .then(data => {
      hideLoader();
      alert(data.message);
      showForm(loginForm);
    })
    .catch(error => {
      console.error('Error resetting password:', error);
      hideLoader();
      alert('Error resetting password: ' + error.message);
    });
  }

  function handleUpload() {
    const description = descriptionInput.value.trim();
    const recipientName = recipientSelect.value;

    if (!clipboardDataUrl) {
      alert('Please paste or drop an image or video before uploading.');
      return;
    }

    if (!recipientName) {
      alert('Please select a recipient.');
      return;
    }

    showLoader();

    uploadToServer(clipboardDataUrl, description, recipientName, mediaType)
      .then(responseData => {
        hideLoader();
        alert('Media and description uploaded successfully.');
        resetForm();
      })
      .catch(error => {
        console.error('Upload Error:', error);
        hideLoader();
        alert('Error uploading media: ' + error.message);
      });
  }

  function uploadToServer(dataUrl, description, recipientName, type) {
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append('file', blob, type === 'image' ? 'image.png' : 'video.mp4');
    formData.append('description', description);
    formData.append('recipient_name', recipientName !== "None" ? recipientName : null);

    return fetch(`${API_BASE_URL}/upload`, {
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

  function handlePaste(event) {
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
  }

  function displayMediaPreview(dataUrl, type) {
    mediaDropZone.innerHTML = '';
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

  function resetForm() {
    clipboardDataUrl = null;
    mediaType = null;
    mediaDropZone.innerHTML = 'Drag and drop your media here or paste from clipboard';
    descriptionInput.value = '';
    recipientSelect.value = "None"; // Set recipient to 'None' by default
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

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
});
