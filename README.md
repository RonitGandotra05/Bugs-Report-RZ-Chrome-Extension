# Chrome Extension: Screenshot Uploader with Description and Strapi Integration

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Setting Up the Chrome Extension](#2-setting-up-the-chrome-extension)
  - [3. Setting Up the FastAPI Server](#3-setting-up-the-fastapi-server)
  - [4. Configuring AWS S3](#4-configuring-aws-s3)
  - [5. Setting Up Strapi CMS](#5-setting-up-strapi-cms)
- [Running the Application](#running-the-application)
- [Security Considerations](#security-considerations)
- [Additional Recommendations](#additional-recommendations)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

This project consists of a Chrome extension that allows users to take screenshots of their current browser tab, add a description, and upload both to an AWS S3 bucket. Additionally, the uploaded image link and description are reflected in a Strapi CMS for content management and display purposes.

## Features

- **Chrome Extension**:
  - Capture screenshots of the current browser tab.
  - Allow users to add a description to the screenshot.
  - Send the screenshot and description to a FastAPI server.

- **FastAPI Server**:
  - Receive the screenshot and description from the Chrome extension.
  - Upload the image to an AWS S3 bucket.
  - Send the image URL and description to a Strapi CMS.

- **Strapi CMS**:
  - Store and manage the image URLs and descriptions.
  - Provide an interface for viewing and managing uploaded content.

## Prerequisites

- **Google Chrome** (for running the extension)
- **Python 3.7+** (for the FastAPI server)
- **Node.js and npm** (for Strapi CMS)
- **AWS Account** (for S3 bucket)
- **AWS CLI** (optional, for configuring AWS)
- **Access to AWS IAM** (to create access keys and set permissions)

## Architecture Overview

```
[Chrome Extension] ---> [FastAPI Server] ---> [AWS S3]
                                         |
                                         ---> [Strapi CMS]
```

1. The **Chrome Extension** captures a screenshot and collects a description.
2. It sends both to the **FastAPI Server**.
3. The **FastAPI Server** uploads the image to **AWS S3** and sends the image URL and description to **Strapi CMS**.
4. **Strapi CMS** stores the data, allowing for content management.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/RonitGandotra05/screenshot_extension.git
cd screenshot_extension
```

### 2. Setting Up the Chrome Extension

#### A. Navigate to the Chrome Extension Directory

```bash
cd chrome-extension
```

#### B. Review Extension Files

- **manifest.json**: Configuration file for the Chrome extension.
- **popup.html**: The UI for the extension popup.
- **popup.js**: JavaScript logic for capturing screenshots and sending data.

#### C. Update `manifest.json`

Ensure that the `host_permissions` field includes your FastAPI server URL.

```json
"host_permissions": ["http://localhost:8000/*"]
```

#### D. Load the Extension into Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** by toggling the switch in the upper right corner.
3. Click **Load unpacked** and select the `chrome-extension` directory.

### 3. Setting Up the FastAPI Server

#### A. Navigate to the FastAPI Directory

```bash
cd ../fastapi-server
```

#### B. Create a Virtual Environment (Optional but Recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### C. Install Dependencies

```bash
pip install -r requirements.txt
```

#### D. Configure Environment Variables

Create a `.env` file in the `fastapi-server` directory with the following content:

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=your-aws-region
AWS_BUCKET_NAME=your-s3-bucket-name
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token
```

**Important**: Replace the placeholders with your actual AWS and Strapi configurations.

#### E. Review and Update `main.py`

Ensure that `main.py` contains the correct configurations and endpoints.

#### F. Run the FastAPI Server

```bash
uvicorn main:app --reload
```

The server should be running on `http://127.0.0.1:8000`.

### 4. Configuring AWS S3

#### A. Create an S3 Bucket

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to **S3** and click **Create bucket**.
3. Provide a unique bucket name and select the desired region.
4. Disable **Block all public access** if you want the images to be publicly accessible.
5. Click **Create bucket**.

#### B. Configure Bucket Policy for Public Access (Optional)

If you want the uploaded images to be publicly accessible:

1. Go to your bucket's **Permissions** tab.
2. Under **Bucket policy**, add:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-s3-bucket-name/*"
       }
     ]
   }
   ```

3. Save the policy.

#### C. AWS IAM Configuration

Ensure your AWS IAM user has permissions to upload objects to the S3 bucket. Attach a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Upload",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": ["arn:aws:s3:::your-s3-bucket-name/*"]
    }
  ]
}
```

### 5. Setting Up Strapi CMS

#### A. Install Strapi

```bash
npx create-strapi-app strapi-cms --quickstart
```

#### B. Start Strapi

```bash
cd strapi-cms
npm run develop
```

Strapi should now be running at `http://localhost:1337`.

#### C. Create an Admin User

- Open `http://localhost:1337/admin` in your browser.
- Follow the prompts to create an admin user.

#### D. Create a Collection Type

1. In the Strapi admin panel, navigate to **Content-Type Builder**.
2. Click **Create new collection type** and name it **Screenshot**.
3. Add the following fields:
   - **image_url**: Text field (required).
   - **description**: Rich Text or Text field.
4. Save and allow Strapi to restart.

#### E. Generate an API Token

1. Navigate to **Settings** > **API Tokens**.
2. Click **Create new API Token**.
3. Name the token and select **Custom** token type.
4. Under **Permissions**, select the **Screenshot** content type and enable the **Create** operation.
5. Save and copy the API token.

#### F. Update `.env` File with Strapi Config

Add the following lines to your `.env` file in the `fastapi-server` directory:

```bash
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your-strapi-api-token
```

---

## Running the Application

1. **Start the FastAPI Server**:

   ```bash
   uvicorn main:app --reload
   ```

2. **Ensure Strapi CMS is Running**:

   ```bash
   cd strapi-cms
   npm run develop
   ```

3. **Load and Use the Chrome Extension**:

   - Open Chrome and click on the extension icon.
   - Enter a description in the provided textarea.
   - Click **"Take Screenshot"**.
   - The screenshot and description will be sent to the FastAPI server.

4. **Verify Uploads**:

   - **AWS S3**: Check your S3 bucket to confirm that the image has been uploaded.
   - **Strapi CMS**: In the Strapi admin panel, navigate to **Content Manager** and verify that the new entry exists with the image URL and description.

---

## Security Considerations

- **AWS Credentials**:
  - **Do Not Hardcode**: Never hardcode AWS credentials in your code.
  - **Environment Variables**: Use environment variables to store sensitive information.
  - **Permissions**: Grant the minimum required permissions to your AWS IAM user.

- **Strapi API Token**:
  - Treat your Strapi API token as a secret.
  - Store it securely in environment variables.

- **CORS Configuration**:
  - Limit `allow_origins` in `main.py` to trusted sources.
  - Example:

    ```python
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["chrome-extension://your-extension-id"],
        allow_credentials=True,
        allow_methods=["POST"],
        allow_headers=["*"],
    )
    ```

- **Data Validation**:
  - Validate and sanitize user inputs to prevent security vulnerabilities.

- **HTTPS**:
  - Consider using HTTPS for the FastAPI server and Strapi CMS in production environments.

---

## Additional Recommendations

- **Error Handling**:
  - Implement comprehensive error handling in both the client and server to aid in debugging and provide better user experience.

- **Logging**:
  - Add logging to the FastAPI server to monitor requests and identify issues.

- **Extension Permissions**:
  - Review the permissions requested in `manifest.json` and ensure they are necessary.

- **Testing**:
  - Write unit and integration tests for the FastAPI server.

- **Scalability**:
  - Consider deploying the FastAPI server and Strapi CMS using services like AWS EC2, Heroku, or Docker containers for scalability.

- **Media Management in Strapi** (Optional):
  - If desired, configure Strapi's Media Library to use AWS S3 for centralized media management.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: Ensure that you comply with all applicable laws and regulations when capturing and uploading screenshots, especially regarding user privacy and data protection.
