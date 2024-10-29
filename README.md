# Bugs Report RZ Chrome Extension

Bugs Report RZ is a Chrome browser extension designed to streamline the process of uploading media (images and videos) directly from your browser to a FastAPI backend. This extension provides a user-friendly interface for authentication, media selection, previewing, and uploading, ensuring a seamless experience for users needing to report bugs with multimedia attachments.

## Table of Contents

- [How It Works](#how-it-works)
  - [User Authentication](#user-authentication)
  - [Media Upload Process](#media-upload-process)
    - [Drag and Drop](#drag-and-drop)
    - [Paste from Clipboard](#paste-from-clipboard)
    - [Media Preview](#media-preview)
  - [Recipient Selection](#recipient-selection)
  - [Session Management](#session-management)
  - [Logout Functionality](#logout-functionality)
- [Technical Overview](#technical-overview)
  - [Extension Structure](#extension-structure)
  - [Communication with FastAPI Backend](#communication-with-fastapi-backend)
  - [Error Handling and Feedback](#error-handling-and-feedback)


## How It Works

### User Authentication

Upon launching the extension, users are presented with a **Login Form** where they can enter their email and password. The extension securely sends these credentials to the FastAPI backend for authentication.

1. **Login Form Display**: 
   - Users input their email and password.
   - An option to "Show Password" is available for user convenience.
2. **Authentication Request**:
   - The extension sends a POST request to the FastAPI `/login` endpoint with the provided credentials.
3. **Session Management**:
   - On successful authentication, an access token is received and stored securely in the browser's local storage.
   - The upload interface is then displayed, replacing the login form.

### Media Upload Process

Once authenticated, users can upload media through the extension's **Upload Form**. The process supports both dragging and dropping files and pasting media from the clipboard.

#### Drag and Drop

1. **Drag Media**: Users can drag an image or video file into the **Media Drop Zone**.
2. **File Validation**: The extension checks the file type to ensure it's a valid image or video.
3. **Preview Display**: A preview of the media is generated and displayed within the drop zone.

#### Paste from Clipboard

1. **Copy Media**: Users copy an image or video to their clipboard.
2. **Paste Media**: Users paste the media into the **Media Drop Zone**.
3. **File Validation and Preview**: Similar to drag and drop, the extension validates the media type and displays a preview.

#### Media Preview

After selecting media via drag-and-drop or paste, the extension provides a real-time preview:
- **Images**: Displayed directly within the drop zone.
- **Videos**: Embedded with playback controls.

### Recipient Selection

Users can select a recipient for their bug report from a dynamically populated dropdown list:

1. **Fetching Users**: Upon successful login, the extension fetches a list of registered users from the FastAPI `/users` endpoint.
2. **Dropdown Population**: The fetched user list populates the **Recipient** dropdown, allowing users to select the appropriate recipient.
3. **Default Option**: An option for "None" is available if no specific recipient is needed.

### Session Management

The extension manages user sessions through access tokens:

- **Token Storage**: Access tokens are stored in the browser's local storage, ensuring persistence across sessions.
- **Automatic Login**: If a valid token exists, the extension bypasses the login form and directly displays the upload interface.
- **Token Security**: Tokens are included in the `Authorization` header for authenticated requests to the backend.

### Logout Functionality

Users can securely end their session using the **Logout** button:

1. **Logout Request**: Clicking the logout button sends a POST request to the FastAPI `/logout` endpoint.
2. **Token Removal**: On successful logout, the access token is removed from local storage.
3. **UI Reset**: The extension reverts to displaying the login form, ensuring the session is terminated.

## Technical Overview

### Extension Structure

The extension comprises the following key files:

- **`manifest.json`**: Defines the extension's metadata, permissions, and resources.
- **`popup.html`**: The HTML structure for the extension's popup interface, including login and upload forms.
- **`popup.js`**: Handles all frontend logic, including user interactions, authentication, media processing, and communication with the backend.
- **`icon.png`**: The icon displayed in the Chrome toolbar.
- **`styles.css`**: (Included within `popup.html`) Styles the extension's UI components for a responsive and user-friendly interface.

### Communication with FastAPI Backend

The extension interacts with the FastAPI backend through several endpoints:

- **Login** (`/login`): Authenticates users and retrieves an access token.
- **Logout** (`/logout`): Terminates user sessions.
- **Fetch Users** (`/users`): Retrieves a list of registered users for recipient selection.
- **Upload Media** (`/upload`): Handles media uploads along with descriptions and recipient information.

**Request Handling**:

- **Authentication**: Credentials are sent via `FormData` in a POST request.
- **Media Upload**: Media files are converted from Data URLs to `Blob` objects and sent using `FormData` in a POST request with the access token in the header for authorization.

### Error Handling and Feedback

The extension provides comprehensive feedback to users:

- **Form Validation**: Ensures that all required fields are filled before submission.
- **Error Alerts**: Displays alerts for failed operations such as authentication errors, upload failures, or network issues.
- **Loading Indicators**: A spinner is displayed during asynchronous operations like login and media upload to indicate ongoing processes.


