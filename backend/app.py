from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
import os
import sys
from dotenv import load_dotenv  

# Load .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)
else:
    print("⚠️ .env file not found! Ensure it exists in the backend directory.")

from config import Config
from extensions.extensions import db
from routes.routes import routes_bp  

def create_app():
    """Initializes the Flask app."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Debugging: Print database URL
    print(f"🛠️ DATABASE_URL from .env: {os.getenv('DATABASE_URL')}")  

    # Check if DATABASE_URL is set
    if not os.getenv("DATABASE_URL"):
        app.logger.error("❌ DATABASE_URL is missing! Check your .env file.")
        sys.exit(1)

    # CORS Configuration
    cors_origins = os.getenv("CORS_ORIGIN", "https://class-attendance-qr-code-system.vercel.app/").split(",")
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    # Initialize Flask extensions
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # Register routes
    app.register_blueprint(routes_bp)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = ",".join(cors_origins)
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # Ensure database connection works
    with app.app_context():
        try:
            with db.engine.connect() as connection:
                connection.execute(text("SELECT 1"))  
            print("✅ Database connected successfully!")
        except OperationalError as e:
            print(f"❌ Database Connection Error: {e}")
            sys.exit(1)

    return app

if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode)
