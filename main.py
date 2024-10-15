from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import boto3
import uuid

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
import os

AWS_ACCESS_KEY_ID = 'AKIAX3DNHXII3JSGHWGA'          # Replace with your access key ID
AWS_SECRET_ACCESS_KEY = 'm0vd1Omb73+J+5bAyP+ktihlX+XmExDshbpT/0jY'  # Replace with your secret access key
AWS_REGION = 'ap-south-1'                        # e.g., 'us-east-1'
AWS_BUCKET_NAME = 'bugsbucketrz'              # Replace with your bucket name

s3_client = boto3.client('s3',
                         aws_access_key_id=AWS_ACCESS_KEY_ID,
                         aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                         region_name=AWS_REGION)

@app.post("/upload")
async def upload_screenshot(file: UploadFile = File(...)):
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
            # Do not include 'ACL' parameter
        )

        # Construct the image URL
        image_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_name}"

        return {"message": "Upload successful", "url": image_url}
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return {"error": str(e)}

