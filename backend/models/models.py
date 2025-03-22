from extensions.extensions import db  # Assuming you have an extensions.py file for db setup
from enum import Enum
from datetime import datetime
import random


class UserRole(Enum):
    ADMIN = "admin"
    STUDENT = "student"
    INSTRUCTOR = "instructor"

    @classmethod
    def is_valid(cls, role):
        """Check if the given role is valid."""
        return role in cls._value2member_map_


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.String(50), unique=True, nullable=False)

    # Relationships
    sessions = db.relationship("Session", backref="instructor", lazy="select")
    attendances = db.relationship("Attendance", backref="student", lazy="select")

    def __repr__(self):
        return f"<User {self.username}, Role: {self.role}, User ID: {self.user_id}>"

    @staticmethod
    def generate_unique_user_id(role):
        """Generate a unique user ID based on role."""
        if not UserRole.is_valid(role):
            raise ValueError(f"Invalid role: {role}")

        prefix = role[:3].lower()
        while True:
            unique_number = random.randint(10000, 99999)
            user_id = f"{prefix}_{unique_number}"
            # Ensure the user ID is unique
            if not db.session.query(User).filter_by(user_id=user_id).first():
                return user_id


def generate_unique_session_id():
    """Generate a unique 5-digit session ID."""
    while True:
        session_id = random.randint(10000, 99999)  # Generate random 5-digit number
        session_id_str = str(session_id)  # Convert to string
        # Ensure the session_id is unique in the database
        if not db.session.query(Session).filter_by(session_id=session_id_str).first():
            return session_id_str  # Return as string


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.Integer, primary_key=True)  # Default primary key
    session_id = db.Column(db.String(5), unique=True, nullable=False, default=generate_unique_session_id)  # 5-digit unique ID
    name = db.Column(db.String(100), nullable=False)
    instructor_id = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=False)  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    attendances = db.relationship("Attendance", backref="session", lazy="joined")

    def __repr__(self):
        return f"<Session {self.name}, Session ID: {self.session_id}, Instructor: {self.instructor_id}>"


class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey("users.user_id"), nullable=False)  
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Attendance Student: {self.student_id}, Session: {self.session_id}, Time: {self.timestamp}>"
