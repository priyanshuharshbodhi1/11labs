# Deploying to Google Cloud Run

Since `gcloud auth login` had issues, we can deploy using a combination of the Google Cloud Console (web UI) and the command line, or try a different login method.

## Prerequisites

1.  **Google Cloud Project**:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project (e.g., `sherpa-deployment`).
    - Note down the **Project ID**.

2.  **Enable APIs**:
    - In your project dashboard, go to "APIs & Services" > "Library".
    - Search for and enable:
        - **Cloud Run Admin API**
        - **Artifact Registry API**
        - **Cloud Build API**

## Option 1: Fix `gcloud` Login (Recommended)

The error you saw (`148`) often happens if the authentication flow is interrupted. Try logging in without launching the browser automatically:

```bash
gcloud auth login --no-launch-browser
```

Copy the long URL provided, paste it into your browser, log in, and copy the verification code back to your terminal.

## Option 2: Deploying via Source (Simple)

You can deploy directly from your source code using Cloud Run's "deploy from source" feature. This builds the container for you in the cloud.

### 1. Deploy Backend

Navigate to the backend directory:

```bash
cd sherpa_backend
```

Run the deploy command (replace `PROJECT_ID` with your actual project ID):

```bash
gcloud run deploy sherpa-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project PROJECT_ID
```

- When prompted, say `y` to enable APIs if asked.
- **Environment Variables**: You'll need to set your API keys.
    - Go to Cloud Run Console -> `sherpa-backend` -> Edit & Deploy New Revision -> Variables.
    - Add your keys (e.g., `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc. found in your `.env` file).

**Note the Backend URL**: It will look like `https://sherpa-backend-xyz-uc.a.run.app`.

### 2. Update Frontend Configuration

You need to tell the frontend where the backend lives.
Open `src/config.js` or wherever you define the backend URL (or check `.env`) and update it to the **Backend URL** from the previous step.
*If you don't have a config file, let me know and we can create one to inject the URL.*

### 3. Deploy Frontend

Navigate to the frontend directory:

```bash
cd ../sherpa_frontend
```

Run the deploy command:

```bash
gcloud run deploy sherpa-frontend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project PROJECT_ID
```

- This might take a few minutes as it builds the React app.

## Option 3: Manual Upload via Console (No CLI needed)

If CLI continues to fail:
1.  Go to **Cloud Run** in the Google Cloud Console.
2.  Click **Create Service**.
3.  Select **Continuously deploy new revisions from a source repository** (requires connecting GitHub).
4.  Connect your repo, select the directory (`sherpa_frontend` or `sherpa_backend`).
5.  Cloud Build will handle the rest using the Dockerfiles we created.

## Troubleshooting

- **Build Fails**: Check the logs URL provided in the terminal.
- **"Unauthenticated"**: Make sure you selected "Allow unauthenticated invocations" so the public can access your site.
