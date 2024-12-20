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
  const recipientInput = document.getElementById('recipient-input');
  const recipientList = document.getElementById('recipient-list');
  const descriptionInput = document.getElementById('description');
  const dashboardButton = document.getElementById('dashboard-btn');
  const currentUrlInput = document.getElementById('current-url');
  const projectInput = document.getElementById('project-input');
  const projectList = document.getElementById('project-list');
  const priorityInput = document.getElementById('priority-input');
  const priorityList = document.getElementById('priority-list');

  const ccRecipientsContainer = document.getElementById('cc-recipients-container');

  let clipboardDataUrl = null;
  let mediaType = null; // 'image' or 'video'
  let accessToken = null;
  let resetEmail = null; // Stores email during password reset flow

  // FastAPI Endpoint
  const API_BASE_URL = 'https://bugapi.tripxap.com';

  // Set initial priority options (already in HTML, but we keep reference)
  const priorityOptions = ['low', 'medium', 'high'];

  // Check if user is already logged in
  accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    showForm(uploadForm);
    fetchRegisteredUsers();
    fetchProjects();
    fetchCurrentTabUrl();
  } else {
    showForm(loginForm);
  }

  // Event Listeners for Login Form
  loginButton.addEventListener('click', function() {
    const email = emailInput.value;
    const password = passwordInput.value;

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
    chrome.tabs.create({ url: 'https://bugszap.netlify.app/homeV2' });
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

  // Add this function after other event listeners
  const ccInput = document.querySelector('.cc-recipient-input');
  ccInput.addEventListener('input', function(e) {
    const value = this.value;
    this.setAttribute('list', 'recipient-list');
    
    // Check if the value matches any option in the datalist
    const options = Array.from(document.getElementById('recipient-list').options);
    const isExactMatch = options.some(opt => opt.value === value);
    
    // If it's an exact match (recipient selected), prevent further typing
    if (isExactMatch) {
        this.addEventListener('keydown', function(e) {
            // Allow only Backspace and Delete keys
            if (e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }
  });

  // Add this after other event listeners
  const addCcBtn = document.getElementById('add-cc-btn');
  addCcBtn.addEventListener('click', function() {
    const ccContainer = document.getElementById('cc-recipients-container');
    const existingRows = ccContainer.querySelectorAll('.cc-recipient-row');
    
    // Limit to 4 CC recipients
    if (existingRows.length >= 4) {
        alert('Maximum 4 CC recipients allowed');
        return;
    }
    
    // Create new row
    const newRow = document.createElement('div');
    newRow.className = 'cc-recipient-row';
    
    // Create input with the same behavior
    const input = document.createElement('input');
    input.className = 'cc-recipient-input';
    input.setAttribute('list', 'recipient-list');
    input.placeholder = `Type to search CC recipient ${existingRows.length + 1}...`;
    
    // Add the same input event listener to new inputs
    input.addEventListener('input', function(e) {
        const value = this.value;
        this.setAttribute('list', 'recipient-list');
        
        // Check if the value matches any option in the datalist
        const options = Array.from(document.getElementById('recipient-list').options);
        const isExactMatch = options.some(opt => opt.value === value);
        
        // If it's an exact match (recipient selected), prevent further typing
        if (isExactMatch) {
            this.addEventListener('keydown', function(e) {
                // Allow only Backspace and Delete keys
                if (e.key !== 'Backspace' && e.key !== 'Delete') {
                    e.preventDefault();
                }
            });
        }
    });
    
    newRow.appendChild(input);
    ccContainer.appendChild(newRow);
  });

  // Functions

  function showForm(form) {
    // Hide all forms
    [loginForm, forgotPasswordForm, otpVerificationForm, uploadForm].forEach(f => f.classList.remove('active'));
    // Show the selected form
    form.classList.add('active');

    // If showing the upload form, fetch the current tab's URL, users, and projects
    if (form === uploadForm) {
      fetchCurrentTabUrl();
      fetchRegisteredUsers();
      fetchProjects();
    }
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
      fetchProjects();
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
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    })
    .then(data => {
      localStorage.removeItem('accessToken');
      accessToken = null;
      showForm(loginForm);
      resetForm();
      resetProjectDatalist(); 
      resetRecipientDatalist();
    })
    .catch(error => {
      console.error('Logout Error:', error);
      // Even if logout fails, proceed to remove the token and show login form
      localStorage.removeItem('accessToken');
      accessToken = null;
      showForm(loginForm);
      resetForm();
      resetProjectDatalist(); 
      resetRecipientDatalist();
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
      const usersWithNone = ['None', ...userList];
      populateDatalist(recipientList, usersWithNone);
    })
    .catch(error => {
      console.error('Fetch Users Error:', error);
      alert('Failed to fetch registered users.');
    });
  }

  function populateDatalist(datalistElement, items) {
    datalistElement.innerHTML = '';
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      datalistElement.appendChild(option);
    });
  }

  function resetRecipientDatalist() {
    recipientList.innerHTML = '';
    const option = document.createElement('option');
    option.value = "None";
    recipientList.appendChild(option);
    recipientInput.value = 'None';
  }

  function fetchProjects() {
    fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    })
    .then(projectListData => {
      window.projectIdMap = {};
      const projectNames = projectListData.map(project => {
        window.projectIdMap[project.name] = project.id;
        return project.name;
      });

      // Attempt to set default project to "web"
      // We'll handle default selection in resetForm or after population
      populateDatalist(projectList, projectNames);
    })
    .catch(error => {
      console.error('Fetch Projects Error:', error);
      alert('Failed to fetch projects.');
    });
  }

  function resetProjectDatalist() {
    projectList.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = "Loading projects...";
    placeholder.disabled = true;
    projectList.appendChild(placeholder);
    projectInput.value = '';
  }

  function handleSendOtp() {
    const email = forgotEmailInput.value;
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
      if (data.message.toLowerCase().includes('otp')) {
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
    const otp = otpInput.value;
    const newPassword = newPasswordInput.value;
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
    const recipientName = recipientInput.value;
    const currentUrl = currentUrlInput.value;
    const projectName = projectInput.value;
    const priority = priorityInput.value;

    // Get CC recipients from all inputs (now each input has only one recipient)
    const ccInputs = document.querySelectorAll('.cc-recipient-input');
    const ccRecipients = Array.from(ccInputs)
        .map(input => input.value)
        .filter(value => value && value !== 'None' && value !== recipientName);

    // Remove duplicates while preserving exact names
    const uniqueCcRecipients = [...new Set(ccRecipients)];

    if (!clipboardDataUrl) {
      alert('Please paste or drop an image or video before uploading.');
      return;
    }

    if (!recipientName) {
      alert('Please select or type a recipient.');
      return;
    }

    if (!projectName || !window.projectIdMap || !window.projectIdMap[projectName]) {
      alert('Please select a valid project from the list.');
      return;
    }
    const projectId = window.projectIdMap[projectName];

    if (!priority) {
      alert('Please select a priority.');
      return;
    }

    if (!currentUrl || currentUrl === 'URL not available') {
      alert('Current tab URL is not available.');
      return;
    }

    showLoader();

    uploadToServer(
      clipboardDataUrl,
      description,
      recipientName !== 'None' ? recipientName : '',
      mediaType,
      projectId,
      priority,
      currentUrl,
      uniqueCcRecipients.join(',')  // Send exact names from datalist
    )
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

  function uploadToServer(dataUrl, description, recipientName, type, projectId, priority, tabUrl, ccRecipients) {
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append('file', blob, type === 'image' ? 'image.png' : 'video.mp4');
    formData.append('description', description);
    formData.append('recipient_name', recipientName);
    formData.append('project_id', projectId);
    formData.append('severity', priority);
    formData.append('tab_url', tabUrl);
    formData.append('cc_recipients', ccRecipients); // Add CC recipients

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
    recipientInput.value = 'None';
    currentUrlInput.value = '';
    projectInput.value = '';
    priorityInput.value = 'low';
    fetchCurrentTabUrl();

    // Clear all CC recipient inputs except the first one
    const ccContainer = document.getElementById('cc-recipients-container');
    const ccInputs = ccContainer.querySelectorAll('.cc-recipient-row');
    ccInputs.forEach((row, index) => {
        if (index === 0) {
            row.querySelector('.cc-recipient-input').value = '';
        } else {
            row.remove();
        }
    });
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

  function fetchCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (chrome.runtime.lastError) {
        console.error('Error fetching tabs:', chrome.runtime.lastError);
        currentUrlInput.value = 'Unable to fetch URL';
        return;
      }

      if (tabs.length === 0) {
        currentUrlInput.value = 'Unable to fetch URL';
        return;
      }

      const activeTab = tabs[0];
      const url = activeTab.url || 'URL not available';
      currentUrlInput.value = url;
    });
  }
});

