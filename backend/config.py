import os
import secrets
import urllib.parse
from dotenv import load_dotenv

# Load .env explicitly
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)
    print(f"✅ .env loaded from: {dotenv_path}")
else:
    print("❌ .env NOT found!")

class Config:
    """Flask Configuration"""

    # Load database URL, fallback to local DB
    database_url = os.getenv(
        "DATABASE_URL", 
        "postgresql://admin:admin123@localhost:5432/attendance_db"
    )

    # Ensure correct format
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    # Ensure SSL for NeonDB
    parsed_url = urllib.parse.urlparse(database_url)
    if "neon.tech" in parsed_url.netloc:
        query_params = dict(urllib.parse.parse_qsl(parsed_url.query))
        query_params["sslmode"] = "require"
        new_query = urllib.parse.urlencode(query_params)
        database_url = parsed_url._replace(query=new_query).geturl()

    # Set database URI
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secret keys
    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
    JWT_SECRET_KEY = SECRET_KEY
