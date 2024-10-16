from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import boto3
import uuid
import os
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json
import re

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = 'AKIAX3DNHXII3JSGHWGA'  # Replace with your access key ID
AWS_SECRET_ACCESS_KEY = 'm0vd1Omb73+J+5bAyP+ktihlX+XmExDshbpT/0jY'  # Replace with your secret access key
AWS_REGION = 'ap-south-1'  # e.g., 'us-east-1'
AWS_BUCKET_NAME = 'bugsbucketrz'  # Replace with your bucket name

s3_client = boto3.client('s3',
                         aws_access_key_id=AWS_ACCESS_KEY_ID,
                         aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                         region_name=AWS_REGION)

# Google Sheets Configuration
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1dksCh-vxoBL4VisSicoK7QeugN1A8dhz8kpPx5qlnNI/edit?gid=0#gid=0'

# Extract the Google Sheet ID from the URL
SHEET_ID = re.search(r'/d/([a-zA-Z0-9-_]+)', SHEET_URL).group(1)

# Load service account credentials
SERVICE_ACCOUNT_FILE = '/home/ronit/Desktop/screenshot_extension/bugssheet-437912-89d62b2d2b27.json'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# Build the service
service = build('sheets', 'v4', credentials=credentials)

@app.post("/upload")
async def upload_screenshot(
    file: UploadFile = File(...),
    description: str = Form(...),
    recipient: str = Form(...)
):
    try:
        # Read the file contents
        file_content = await file.read()

        # Generate a unique file name
        file_name = f"screenshot-{uuid.uuid4()}.png"

        # Upload to S3 without ACL
        s3_client.put_object(
            Bucket=AWS_BUCKET_NAME,
            Key=file_name,
            Body=file_content,
            ContentType='image/png'
        )

        # Construct the image URL
        image_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_name}"

        # Save the data to Google Sheets in the specified columns (B, F, G)
        values = [[None,image_url, f'=IMAGE("{image_url}")', None, None, description, recipient]]
        body = {
            'values': values
        }
        sheet = service.spreadsheets()
        result = sheet.values().append(
            spreadsheetId=SHEET_ID,
            range='Pending!B2',  # Start appending from column B, second row
            valueInputOption="RAW",
            body=body
        ).execute()

        # Return the response
        return {
            "message": "Upload successful",
            "url": image_url,
            "description": description,
            "recipient": recipient
        }
    except Exception as e:
        print(f"Error uploading to S3 or Google Sheets: {e}")
        return {"error": str(e)}
