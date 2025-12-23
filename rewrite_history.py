import os
import subprocess
import random
import time
from datetime import datetime, timedelta

# Configuration
USER_NAME = "Priyanshu Harshbodhi"
USER_EMAIL = "priyanshuqpwp@gmail.com"
START_DATE = datetime(2025, 12, 5, 10, 0, 0)
END_DATE = datetime(2025, 12, 23, 20, 0, 0)

# File groups for commits (logical progression)
COMMIT_PLAN = [
    (["hugo/.gitignore", "hugo_backend/.gitignore"], "Initial project setup and gitignore configurations"),
    (["hugo_backend/requirements.txt", "hugo_backend/.env.example"], "Add backend dependencies and environment templates"),
    (["hugo/package.json", "hugo/package-lock.json", "hugo/.env.example"], "Initialize frontend dependencies and config"),
    (["hugo/public"], "Setup React public assets"),
    # REMOVED venv to prevent crashes
    (["hugo/src/index.js", "hugo/src/index.css"], "Setup React application entry points"),
    (["hugo/src/App.js", "hugo/src/App.test.js"], "Create main App component structure"),
    (["hugo/src/reportWebVitals.js", "hugo/src/setupTests.js"], "Add frontend performance and test utilities"),
    (["hugo/src/utils/api.js"], "Implement backend API communication utility"),
    (["hugo/src/utils/elevenlabs.js"], "Add ElevenLabs text-to-speech integration service"),
    (["hugo/src/config/api-keys.js"], "Configure central API key management"),
    (["hugo/src/styles/mapStyles.js"], "Define Google Maps custom styling"),
    (["hugo/src/styles/App.css"], "Update application styling and responsive layout"),
    (["hugo/src/components/Map.js"], "Implement Google Maps component with geolocation support"),
    (["hugo/src/components/RecordButton.js"], "Create voice recording interface component"),
    (["hugo/src/hooks/useLocation.js"], "Add custom hook for handling user location"),
    (["hugo_backend/main.py"], "Setup FastAPI backend server and endpoints"),
    (["hugo_backend/agent.py"], "Implement core CityWalk agent logic with Groq integration"),
    (["hugo_backend/test_groq.py", "hugo_backend/test_groq_whisper.py", "hugo_backend/test_all_apis.py", "test_groq.py", "test_groq_whisper.py", "test_all_apis.py"], "Add comprehensive API testing scripts"), 
    (["README.md", "testing_guide.md", "test_report.md"], "Finalize documentation and testing guides"),
]

def run_cmd(cmd, ignore_error=False):
    try:
        subprocess.run(cmd, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        if ignore_error:
            print(f"Warning: Command failed but ignored: {cmd}")
        else:
            print(f"Error executing: {cmd}")
            raise e

def generate_dates(start, end, n):
    delta = (end - start).total_seconds()
    dates = []
    for i in range(n):
        # Evenly distribute but add randomness
        base_time = start + timedelta(seconds=(delta * (i / (n - 1))))
        # Random jitter +/- 4 hours
        jitter = random.randint(-14400, 14400)
        final_time = base_time + timedelta(seconds=jitter)
        # Ensure strict ordering
        if dates and final_time <= dates[-1]:
            final_time = dates[-1] + timedelta(minutes=random.randint(10, 120))
        dates.append(final_time)
    return dates

def main():
    # 1. Reset Git
    print("Resetting git repository...")
    if os.path.exists(".git"):
         # Use run_cmd with ignore_error just in case files are locked
        subprocess.run("rm -rf .git", shell=True)
    
    run_cmd("git init")
    run_cmd(f'git config user.name "{USER_NAME}"')
    run_cmd(f'git config user.email "{USER_EMAIL}"')
    
    # Check for any remaining files to catch all in final commit if missed
    all_files = set()
    for root, dirs, files in os.walk("."):
        if ".git" in root or "node_modules" in root or "venv" in root or "__pycache__" in root:
            continue
        for f in files:
            all_files.add(os.path.join(root, f))

    # 2. Execute Commits
    # Recalculate N based on actual plan length
    actual_plan_len = len(COMMIT_PLAN)
    dates = generate_dates(START_DATE, END_DATE, actual_plan_len + 1) # +1 for final cleanup
    
    for i, (files, message) in enumerate(COMMIT_PLAN):
        # Format date for git
        date_str = dates[i].strftime("%Y-%m-%dT%H:%M:%S")
        env = os.environ.copy()
        env["GIT_AUTHOR_DATE"] = date_str
        env["GIT_COMMITTER_DATE"] = date_str
        
        # Add specific files
        for f in files:
            if os.path.exists(f):
                # Use ignore_error=True for git add in case of weird permission/path issues
                # But mostly we check existence first
                subprocess.run(f"git add '{f}'", shell=True, check=False) 
            elif f == "hugo/public": # Handle directory
                subprocess.run(f"git add hugo/public", shell=True, check=False)
            else:
                 print(f"Skipping missing file: {f}")
        
        # Check if anything staged
        status = subprocess.run("git diff --cached --quiet", shell=True)
        if status.returncode == 1: # Changes exist
            print(f"Committing ({i+1}/{actual_plan_len}): {message} at {date_str}")
            subprocess.run(f'git commit -m "{message}"', shell=True, env=env)
        else:
            print(f"Skipping empty commit for: {files}")

    # 3. Catch-all Final Commit
    date_str = dates[-1].strftime("%Y-%m-%dT%H:%M:%S")
    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str
    
    print("Adding all remaining files...")
    run_cmd("git add .")
    status = subprocess.run("git diff --cached --quiet", shell=True)
    if status.returncode == 1:
        print("Committing remaining files...")
        subprocess.run('git commit -m "Final code integration and cleanup"', shell=True, env=env)
    
    print("History rewrite complete!")

if __name__ == "__main__":
    main()
