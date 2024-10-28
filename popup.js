document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('login-btn');

  const uploadForm = document.getElementById('upload-form');
  const logoutButton = document.getElementById('logout-btn');
  const screenshotPreview = document.getElementById('screenshot-preview');
  const uploadButton = document.getElementById('upload-btn');

  let clipboardImage = null;
  let accessToken = null;

  // Recipient name to email and phone number mapping
  const recipientDataMap = {
    "Ronit": { email: "ronit@example.com", phone: "918130294123" },
    "Kapil": { email: "kapil@example.com", phone: "919871457336" },
    "Yash": { email: "yash@example.com", phone: "918194939908" },
    "Saurabh": { email: "saurabh@example.com", phone: "918130858522" },
    "Sandeep Yadav": { email: "sandeep.yadav@example.com", phone: "917503667613" },
    "Shubham Sachdeva": { email: "shubham.sachdeva@example.com", phone: "917827764486" },
    "Piyush Suneja": { email: "piyush.suneja@example.com", phone: "918708680186" },
    "Yash Kumar Pal": { email: "yash.kumar.pal@example.com", phone: "918448016807" },
    "Kapil Sharma": { email: "kapil.sharma@example.com", phone: "919871457336" },
    "Arun Kumar": { email: "arun.kumar@example.com", phone: "918178118932" },
    "Rohan Thakur": { email: "rohan.thakur@example.com", phone: "917982906149" },
    "Subhashish Behera": { email: "subhashish.behera@example.com", phone: "919558078941" },
    "Boby": { email: "boby@example.com", phone: "919718748449" },
    "Ankita Singh": { email: "ankita.singh@example.com", phone: "918920903354" },
    "CP Dhaundiyal": { email: "cp.dhaundiyal@example.com", phone: "918755023705" },
    "Sajal": { email: "sajal@example.com", phone: "916280097568" },
    "Ryan": { email: "ryan@example.com", phone: "918586862674" },
    "Karan Grover": { email: "karan.grover@example.com", phone: "918208742993" },
    "Karan Sachdeva": { email: "karan.sachdeva@example.com", phone: "919773923009" },
    "Vikas Singh": { email: "vikas.singh@example.com", phone: "919958311494" },
    "None": { email: "none@example.com", phone: null }
  };

  // UltraMsg API credentials (Note: Including these in client-side code is insecure)
  const ULTRAMSG_INSTANCE_ID = 'instance29265';
  const ULTRAMSG_TOKEN = 'fa0r4vzkca0bwm8r';

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
      showUploadForm();
    })
    .catch(error => {
      console.error('Error:', error);
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

  // Listen for the paste event to capture the clipboard image
  document.addEventListener('paste', (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = function(e) {
          clipboardImage = e.target.result;
          screenshotPreview.style.backgroundImage = `url(${clipboardImage})`;
          screenshotPreview.textContent = '';
        };
        reader.readAsDataURL(blob);
      }
    }
  });

  // Upload the pasted screenshot, description, and recipient
  uploadButton.addEventListener('click', function() {
    const description = document.getElementById('description').value;
    const recipientName = document.getElementById('recipient').value;

    if (!clipboardImage) {
      alert('Please paste a screenshot before uploading.');
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

    uploadToServer(clipboardImage, description, recipientData.email)
      .then(responseData => {
        alert('Screenshot, description, and recipient uploaded successfully.');
        resetForm();

        // Send WhatsApp message if recipient is not "None"
        if (recipientName !== "None" && recipientData.phone) {
          sendWhatsAppMessage(recipientData.phone, responseData.url, description);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error uploading screenshot: ' + error.message);
      });
  });

  function uploadToServer(dataUrl, description, recipientEmail) {
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append('file', blob, 'screenshot.png');
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

  function sendWhatsAppMessage(phoneNumber, imageLink, caption) {
    const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/image`;
    const payload = {
      token: ULTRAMSG_TOKEN,
      to: phoneNumber + "@c.us",
      image: imageLink,
      caption: "Hi, the following bug has been found:\n" + caption
    };

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
    clipboardImage = null;
    screenshotPreview.style.backgroundImage = '';
    screenshotPreview.textContent = 'Paste your screenshot here';
    document.getElementById('description').value = '';
    document.getElementById('recipient').selectedIndex = 0;
  }
});
