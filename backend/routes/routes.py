from flask import Blueprint, request, jsonify, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from flask_cors import CORS
from io import BytesIO
import qrcode
import uuid
import os
from extensions.extensions import db
from models.models import User, UserRole, Attendance, Session
from datetime import datetime, timedelta

# Define Blueprint
routes_bp = Blueprint("routes", __name__)
CORS(routes_bp)

# Define API Base URL
API_BASE_URL = os.getenv("API_BASE_URL", "https://classattendanceqrcodesystem.onrender.com")

@routes_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "API is running"}), 200


### AUTH ROUTES ###

# Register Route
@routes_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        if not all([data.get('username'), data.get('email'), data.get('password'), data.get('role')]):
            return jsonify({"error": "All fields are required."}), 400

        # Ensure role is valid
        role = data['role'].lower()
        if role not in ['student', 'instructor', 'admin']:
            return jsonify({"error": "Invalid role."}), 400

        # Generate user ID
        prefix = {'student': 'stu', 'instructor': 'ins', 'admin': 'adm'}.get(role, 'usr')
        user_id = f"{prefix}_{uuid.uuid4().hex[:5]}"

        # Hash the password before storing it
        hashed_password = generate_password_hash(data['password'])

        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password,
            role=role,
            user_id=user_id
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully", "user_id": new_user.user_id}), 200

    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({"error": "An error occurred during registration."}), 500

# Login Route
@routes_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required."}), 400

        user = User.query.filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({"error": "Invalid email or password."}), 401

        # Create JWT token with user_id and role as claims
        access_token = create_access_token(
            identity=user.user_id,  # Storing user_id as identity in the token
            additional_claims={"role": user.role},  # Adding role as additional claim
            expires_delta=timedelta(hours=1)
        )

        # Return response with user_id, role, and token
        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "user_id": user.user_id,  # Include user_id in the response
            "role": user.role  # Include user role
        }), 200

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"error": "An error occurred during login."}), 500


### SESSION ROUTES ###

@routes_bp.route("/api/sessions", methods=["POST"])
@jwt_required()
def create_session():
    try:
        # Get the current user's ID from the JWT token
        current_user_id = get_jwt_identity()
        
        # Find the user (instructor) who is making the request
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'instructor':
            return jsonify({"error": "Only instructors can create sessions"}), 403

        # Parse the data from the incoming request
        data = request.get_json()
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Session name is required"}), 400

        # Create a new session with the instructor's user_id and the session name
        new_session = Session(name=name, instructor_id=user.user_id)
        
        # Add and commit the new session to the database
        db.session.add(new_session)
        db.session.commit()

        # Retrieve the session again to include `created_at` and `session_id` (5-digit code)
        created_session = Session.query.filter_by(id=new_session.id).first()

        # Return the response with the necessary session details
        return jsonify({
            "message": "Session created successfully",
            "session_id": created_session.session_id,  # Return the 5-digit session ID
            "name": created_session.name,
            "instructor_id": created_session.instructor_id,
            "created_at": created_session.created_at.strftime("%Y-%m-%d %H:%M:%S")  # Convert to readable format
        }), 201

    except Exception as e:
        print(f"Error during session creation: {e}")
        return jsonify({"error": "An error occurred during session creation."}), 500


@routes_bp.route("/api/sessions", methods=["GET"])
@jwt_required()
def get_sessions():
    try:
        # Get the current user ID from the JWT token
        current_user_id = get_jwt_identity()

        # Retrieve the user
        user = User.query.filter_by(user_id=current_user_id).first()

        # Check if the user exists and is an instructor
        if not user or user.role != 'instructor':
            return jsonify({"error": "Only instructors can view their sessions"}), 403

        # Query only sessions belonging to this instructor
        sessions = Session.query.filter_by(instructor_id=user.user_id).all()

        # Include session_id in the response
        return jsonify([{
            "id": s.id,
            "session_id": s.session_id,  # Add this line to include session_id
            "name": s.name,
            "instructor_id": s.instructor_id,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S")  # Convert to readable format
        } for s in sessions]), 200

    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return jsonify({"error": "An error occurred while retrieving sessions."}), 500


### ATTENDANCE ROUTES ###

@routes_bp.route("/api/attendance", methods=["POST"])
@jwt_required()
def mark_attendance():
    try:
        # Get the current user's ID from the JWT token
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()

        # Ensure the user is a student
        if not user or user.role != "student":
            return jsonify({"error": "Only students can mark attendance"}), 403

        # Parse the session_id from the request
        data = request.get_json()
        session_id = data.get("session_id")

        # Validate session_id
        if not session_id:
            return jsonify({"error": "Missing session_id"}), 400

        # Query the session using session_id
        session = Session.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({"error": "Invalid session ID"}), 400

        # Log session and student info for debugging
        print(f"Student {user.user_id} marking attendance for session {session_id}")

        # Check if attendance is already marked
        existing_attendance = Attendance.query.filter_by(
            student_id=user.user_id, session_id=session_id  # Use session_id directly
        ).first()
        if existing_attendance:
            return jsonify({"message": "Attendance already marked"}), 200

        # Mark attendance
        new_attendance = Attendance(
            student_id=user.user_id,
            session_id=session_id,  # Use session_id directly
            timestamp=datetime.utcnow()
        )
        db.session.add(new_attendance)
        db.session.commit()

        print(f"Attendance successfully marked for student {user.user_id} in session {session_id}")

        return jsonify({"message": "Attendance marked successfully!"}), 201

    except Exception as e:
        print(f"Error marking attendance: {e}")
        return jsonify({"error": "An error occurred while marking attendance."}), 500

@routes_bp.route("/api/attendance/<int:session_id>", methods=["GET"])
@jwt_required()
def view_attendance(session_id):
    try:
        # Get current user ID
        current_user_id = get_jwt_identity()

        # Check if the user is an instructor
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'instructor':
            return jsonify({"error": "Only instructors can view attendance"}), 403

        # Retrieve the session and ensure it belongs to the instructor
        session = Session.query.filter_by(id=session_id, instructor_id=user.user_id).first()
        if not session:
            return jsonify({"error": "Session not found or does not belong to you"}), 404

        # Retrieve all attendance records for the session
        attendance_records = Attendance.query.filter_by(session_id=session_id).all()

        return jsonify({
            "session_id": session.id,
            "session_name": session.name,  # Include session name
            "attendance": [
                {
                    "student_id": record.student_id,
                    "timestamp": record.timestamp.strftime("%Y-%m-%d %H:%M:%S")  # Format date
                }
                for record in attendance_records
            ]
        }), 200

    except Exception as e:
        print(f"Error retrieving attendance: {e}")
        return jsonify({"error": "An error occurred while retrieving attendance records."}), 500

### QR CODE ROUTES ###

@routes_bp.route("/api/qr/<string:session_id>", methods=["GET"])  # Change to string for session_id
@jwt_required()
def generate_qr(session_id):
    session = Session.query.filter_by(session_id=session_id).first()  # Query by session_id
    if not session:
        return jsonify({"error": "Session not found"}), 404

    qr_data = f"{API_BASE_URL}/api/attendance/mark/{session_id}"  # Use session_id in the URL

    # Create a QRCode instance with the desired settings
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill="black", back_color="white")
    img_io = BytesIO()
    img.save(img_io, format="PNG")
    img_io.seek(0)

    return send_file(img_io, mimetype="image/png")

 # ---------------------Admin Routes---------------------#

# Get all users (Admin only)
@routes_bp.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can view users"}), 403

        users = User.query.all()
        return jsonify([{
            "user_id": u.user_id,
            "username": u.username,
            "email": u.email,
            "role": u.role
        } for u in users]), 200

    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"error": "An error occurred while fetching users."}), 500

# Get all attendance records (Admin only)
@routes_bp.route("/api/attendance", methods=["GET"])
@jwt_required()
def get_all_attendance():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can view attendance"}), 403

        attendance_records = Attendance.query.all()
        return jsonify([{
            "id": record.id,
            "student_id": record.student_id,
            "session_id": record.session_id,
            "timestamp": record.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for record in attendance_records]), 200

    except Exception as e:
        print(f"Error fetching attendance: {e}")
        return jsonify({"error": "An error occurred while fetching attendance records."}), 500

# Get all sessions (Admin only)
@routes_bp.route("/api/sessions/all", methods=["GET"])
@jwt_required()
def get_all_sessions():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can view all sessions"}), 403

        sessions = Session.query.all()
        return jsonify([{
            "id": s.id,
            "name": s.name,
            "instructor_id": s.instructor_id,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for s in sessions]), 200

    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return jsonify({"error": "An error occurred while fetching sessions."}), 500

# Delete a user (Admin only)
@routes_bp.route('/api/users/<string:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can delete users"}), 403

        user_to_delete = User.query.filter_by(user_id=user_id).first()
        if not user_to_delete:
            return jsonify({"error": "User not found"}), 404

        # Delete related records (e.g., attendance, sessions)
        Attendance.query.filter_by(student_id=user_id).delete()
        Session.query.filter_by(instructor_id=user_id).delete()

        # Delete the user
        db.session.delete(user_to_delete)
        db.session.commit()

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({"error": f"An error occurred while deleting the user: {str(e)}"}), 500

# Delete a session (Admin only)
@routes_bp.route('/api/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can delete sessions"}), 403

        session_to_delete = Session.query.filter_by(id=session_id).first()
        if not session_to_delete:
            return jsonify({"error": "Session not found"}), 404

        # Delete related attendance records
        Attendance.query.filter_by(session_id=session_id).delete()

        # Delete the session
        db.session.delete(session_to_delete)
        db.session.commit()

        return jsonify({"message": "Session deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting session: {e}")
        return jsonify({"error": f"An error occurred while deleting the session: {str(e)}"}), 500

# Delete an attendance record (Admin only)
@routes_bp.route('/api/attendance/<int:attendance_id>', methods=['DELETE'])
@jwt_required()
def delete_attendance(attendance_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=current_user_id).first()
        if not user or user.role != 'admin':
            return jsonify({"error": "Only admins can delete attendance records"}), 403

        attendance_to_delete = Attendance.query.filter_by(id=attendance_id).first()
        if not attendance_to_delete:
            return jsonify({"error": "Attendance record not found"}), 404

        db.session.delete(attendance_to_delete)
        db.session.commit()

        return jsonify({"message": "Attendance record deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting attendance record: {e}")
        return jsonify({"error": "An error occurred while deleting the attendance record."}), 500