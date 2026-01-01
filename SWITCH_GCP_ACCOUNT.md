# Switching Google Cloud Project Account

This guide details the process to switch the Google Cloud Platform (GCP) account/project used by Sherpa.

## 1. Google Cloud Console (Web)

1.  **Select Project**: Log in to [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create/Select New Project**: Click the project dropdown in the top bar and select your new project (or create one). Note the **Project ID** (e.g., `my-new-project-12345`).
3.  **Enable APIs**:
    - Go to **APIs & Services > Library**.
    - Search for and enable:
        - **Vertex AI API** (`aiplatform.googleapis.com`)
        - **Google Places API (New)** or **Places API** (`places.googleapis.com`)
        - **Google Maps JavaScript API** (`maps-backend.googleapis.com`)
        - **Geocoding API** (`geocoding-backend.googleapis.com`)

## 2. Local Environment (Terminal)

Authenticate with the new account in your terminal to allow the backend to access Vertex AI.

```bash
# 1. Login to GCP (Browser will open)
gcloud auth login

# 2. Set the new project as active locally
gcloud config set project [YOUR_NEW_PROJECT_ID]

# 3. Application Default Credentials (ADC) for Vertex AI SDK
gcloud auth application-default login
```

## 3. Codebase Configuration

Update the project ID in the codebase. You can do this manually or use the search-and-replace command below.

### Method A: Manual Update

Replace the old project ID (e.g., `beaming-talent-396906`) with your new Project ID in the following files:

1.  **Backend Agents**:
    -   `sherpa_backend/agents/city_walk_agent.py` (Line ~115)
    -   `sherpa_backend/agents/story_agent.py` (Line ~18 and ~26)

2.  **Deployment Scripts**:
    -   `deploy.sh` (Line ~5: `PROJECT_ID=...`)

3.  **Utility Scripts**:
    -   `sherpa_backend/scripts/check_models.py` (Line ~33)

4.  **Frontend Config**:
    -   If you generated a new Google Maps API Key, update `sherpa_frontend/src/config/api-keys.js` (or `.env` file if used).

### Method B: Bulk Command (Linux/Mac)

Run this command from the root of your repository (`/home/priyanshu/repos/11labs/`) to replace it everywhere:

```bash
# Replace OLD_ID and NEW_ID with your actual project IDs
grep -r "OLD_ID" .
# Verify the list, then run:
find . -type f \( -name "*.py" -o -name "*.sh" \) -not -path "*/venv/*" -exec sed -i 's/OLD_ID/NEW_ID/g' {} +
```

Example:
```bash
find . -type f \( -name "*.py" -o -name "*.sh" \) -not -path "*/venv/*" -exec sed -i 's/beaming-talent-396906/YOUR_NEW_PROJECT_ID/g' {} +
```

## 4. Verification

After updating:

1.  Restart your backend server:
    ```bash
    python main.py
    ```
2.  Send a test query to Ensure Vertex AI calls succeed.
