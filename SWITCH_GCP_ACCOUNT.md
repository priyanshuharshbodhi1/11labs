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
        - **Google Search API** (if used for images)

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

Update the project ID in the backend configuration to match your new project.

### Backend (`sherpa_backend/`)

1.  **Update `agents/city_walk_agent.py`**:
    - Open the file and locate the initialization line in `__init__`.
    - Replace the project ID with your new one.

    ```python
    # agents/city_walk_agent.py (approx line 85)
    vertexai.init(project="YOUR_NEW_PROJECT_ID", location="us-central1")
    ```

2.  **Update `agents/story_agent.py`**:
    - Open the file and locate the initialization line in `__init__`.
    - Replace the project ID.

    ```python
    # agents/story_agent.py (approx line 22)
    vertexai.init(project="YOUR_NEW_PROJECT_ID", location="us-central1")
    ```

3.  **Update `.env` (API Keys)**:
    - If you generated a new API Key for Google Maps/Places in the new project, update your `.env` file in `sherpa_backend/.env`.
    - Update `GOOGLE_API_KEY=AIzaSy...`

### Frontend (`sherpa_frontend/`)

1.  **Update API Keys**:
    - Check `src/config/api-keys.js`.
    - Update the `GOOGLE` key with the new project's API key.
    - *Note: Ensure your new API key has restrictions allowing `localhost:3000` (or your deployment domain).*
