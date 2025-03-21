from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config
from extensions.extensions import db
from routes.routes import routes_bp  # Correct import
from sqlalchemy.exc import OperationalError
from psycopg2 import connect, errors
import os

def create_database():
    """Ensures that the PostgreSQL database exists before connecting."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set in the environment!")

    # Extract database name from the URL
    db_name = db_url.rsplit("/", 1)[-1]
    db_url_without_db = db_url.rsplit("/", 1)[0]  # Remove database name to connect to the server

    # Connect to PostgreSQL and create the database if it doesn't exist
    try:
        conn = connect(db_url)
        conn.close()  # Database exists, no need to create
    except errors.InvalidCatalogName:
        # If database doesn't exist, create it
        print(f"Database '{db_name}' not found. Creating it now...")
        admin_conn = connect(db_url_without_db + "/postgres")  # Connect to default `postgres` DB
        admin_conn.autocommit = True
        cursor = admin_conn.cursor()
        cursor.execute(f"CREATE DATABASE {db_name};")
        cursor.close()
        admin_conn.close()
        print(f"Database '{db_name}' created successfully.")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure the database is created before initializing app
    create_database()

    # Initialize extensions
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:3000"}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Allow DELETE method
        allow_headers=["Content-Type", "Authorization"]  # Allow necessary headers
    )
    db.init_app(app)
    migrate = Migrate(app, db)
    JWTManager(app)

    # Register Routes
    app.register_blueprint(routes_bp)  # Corrected method

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"  # Allow DELETE method
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print("All tables are ensured to exist.")
        except OperationalError as e:
            print(f"Database Error: {e}")

    return app

if __name__ == "__main__":
    app = create_app()
    debug_mode = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode)