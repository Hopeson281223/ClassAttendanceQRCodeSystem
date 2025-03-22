import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const AdminDashboard = () => {
    const [activeFeature, setActiveFeature] = useState("manageUsers"); // Default feature
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Fetch data based on the active feature
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                if (activeFeature === "manageUsers") {
                    const response = await axios.get("https://classattendanceqrcodesystem.onrender.com/api/users", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUsers(response.data);
                } else if (activeFeature === "manageRecords") {
                    const [attendanceRes, sessionsRes] = await Promise.all([
                        axios.get("https://classattendanceqrcodesystem.onrender.com/api/attendance", {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                        axios.get("https://classattendanceqrcodesystem.onrender.com/api/sessions/all", {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                    ]);
                    setAttendance(attendanceRes.data);
                    setSessions(sessionsRes.data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeFeature]);

    // Handle logout
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            localStorage.clear();
            navigate("/login");
        }
    };

    // Delete a user
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`https://classattendanceqrcodesystem.onrender.com/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsers(users.filter((user) => user.user_id !== userId));
                alert("User deleted successfully!");
            } catch (error) {
                setError("Failed to delete user.");
            }
        }
    };

    // Delete a session
    const handleDeleteSession = async (sessionId) => {
        if (window.confirm("Are you sure you want to delete this session?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`https://classattendanceqrcodesystem.onrender.com/api/sessions/${sessionId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSessions(sessions.filter((session) => session.id !== sessionId));
                alert("Session deleted successfully!");
            } catch (error) {
                setError("Failed to delete session.");
            }
        }
    };

    // Delete an attendance record
    const handleDeleteAttendance = async (attendanceId) => {
        if (window.confirm("Are you sure you want to delete this attendance record?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`https://classattendanceqrcodesystem.onrender.com/api/attendance/${attendanceId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAttendance(attendance.filter((record) => record.id !== attendanceId));
                alert("Attendance record deleted successfully!");
            } catch (error) {
                setError("Failed to delete attendance record.");
            }
        }
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <nav>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li style={{ marginBottom: "15px" }}>
                        <button
                            onClick={() => setActiveFeature("manageUsers")}
                            className={`nav-btn ${activeFeature === "manageUsers" ? "active" : ""}`}
                        >
                            📋 Manage Users
                        </button>
                    </li>
                    <li style={{ marginBottom: "15px" }}>
                        <button
                            onClick={() => setActiveFeature("manageRecords")}
                            className={`nav-btn ${activeFeature === "manageRecords" ? "active" : ""}`}
                        >
                            📊 Manage Records
                        </button>
                    </li>
                </ul>
            </nav>

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {/* Display the active feature */}
            {activeFeature === "manageUsers" && (
                <div>
                    <h2>Manage Users</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan="4">No users available</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.user_id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>
                                            <button onClick={() => handleDeleteUser(user.user_id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeFeature === "manageRecords" && (
                <div>
                    <h2>Manage Records</h2>
                    <h3>Attendance Records</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Session ID</th>
                                <th>Timestamp</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length === 0 ? (
                                <tr><td colSpan="4">No attendance records available</td></tr>
                            ) : (
                                attendance.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.student_id}</td>
                                        <td>{record.session_id}</td>
                                        <td>{new Date(record.timestamp).toLocaleString()}</td>
                                        <td>
                                            <button onClick={() => handleDeleteAttendance(record.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <h3>Session Records</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Session Name</th>
                                <th>Instructor ID</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length === 0 ? (
                                <tr><td colSpan="4">No session records available</td></tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td>{session.name}</td>
                                        <td>{session.instructor_id}</td>
                                        <td>{new Date(session.created_at).toLocaleString()}</td>
                                        <td>
                                            <button onClick={() => handleDeleteSession(session.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <li>
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </li>
        </div>
    );
};

export default AdminDashboard;