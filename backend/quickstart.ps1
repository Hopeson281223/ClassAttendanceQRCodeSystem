
.\venv\Scripts\Activate

# Set Flask environment variables (if needed)
[System.Environment]::SetEnvironmentVariable("FLASK_APP", "app.py", "Process")
[System.Environment]::SetEnvironmentVariable("FLASK_ENV", "development", "Process")

# Run Flask
python -m flask run
