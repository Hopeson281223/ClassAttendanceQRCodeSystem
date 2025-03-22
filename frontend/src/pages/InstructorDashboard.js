import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://classattendanceqrcodesystem.onrender.com";

const InstructorDashboard = () => {
    const [sessionName, setSessionName] = useState("");
    const [currentSession, setCurrentSession] = useState(null);
    const [qrUrl, setQrUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState([]);
    const [instructorId, setInstructorId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedInstructorId = localStorage.getItem("instructor_id");

        if (!token) {
            alert("Unauthorized! Please log in.");
            navigate("/login");
        } else {
            setInstructorId(storedInstructorId);
            fetchLatestSession();
        }
    }, []);

    const fetchLatestSession = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Unauthorized! Please log in.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch sessions.");
            }

            const data = await response.json();
            if (data.length > 0) {
                const latestSession = data.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                )[0];

                console.log("Latest Session:", latestSession);
                setCurrentSession({
                    ...latestSession,
                    formattedTime: new Date(latestSession.created_at).toLocaleString(),
                });
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
            alert(error.message || "Failed to fetch latest session.");
        }
    };

    const handleCreateSession = async () => {
        if (!sessionName.trim()) {
            alert("Please enter a session name.");
            return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Authentication error: Missing token. Please log in again.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: sessionName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create session");
            }

            const data = await response.json();
            console.log("Created Session:", data);
            setSessionName("");
            alert("Session created successfully!");
            fetchLatestSession();
        } catch (error) {
            alert(error.message || "Failed to create session");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQRCode = () => {
        if (!currentSession) {
            alert("No session available to generate QR code.");
            return;
        }
        setQrUrl(`${API_BASE_URL}/session/${currentSession.session_id}`);
    };

    const fetchAttendance = async (sessionId) => {
        if (!sessionId) {
            alert("No session ID provided.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Unauthorized! Please log in.");
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/attendance/${sessionId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                setAttendance(data.attendance);
            } else {
                alert(data.error || "Failed to fetch attendance records");
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            alert("An error occurred while fetching attendance.");
        }
    };

    return (
        <div className="instructor-dashboard">
            <h1>Instructor Dashboard</h1>
            {instructorId && <h3>Instructor ID: {instructorId}</h3>}

            <input
                type="text"
                placeholder="Enter session name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
            />
            <button onClick={handleCreateSession} disabled={loading}>
                {loading ? "Creating..." : "Create Session"}
            </button>

            <h2>Current Session</h2>
            {currentSession ? (
                <div>
                    <p>
                        <strong>{currentSession.name}</strong> (Session ID: {currentSession.session_id}) <br />
                        Created At: {currentSession.formattedTime}
                    </p>
                    <button onClick={() => fetchAttendance(currentSession.session_id)}>View Attendance</button>
                </div>
            ) : (
                <p>No active session. Create one to get started.</p>
            )}

            {currentSession && (
                <div>
                    <button onClick={handleGenerateQRCode} style={{ marginTop: "10px" }}>
                        Generate QR Code
                    </button>
                    {qrUrl && (
                        <div>
                            <h3>QR Code for Session</h3>
                            <QRCodeCanvas
                                value={qrUrl}
                                style={{ margin: "20px", border: "5px solid white" }}
                            />
                            <p>Scan to join</p>
                        </div>
                    )}
                </div>
            )}

            {attendance.length > 0 && currentSession && (
                <div>
                    <h2>Attendance for {currentSession.name}</h2>
                    <ul>
                        {attendance.map((record, index) => (
                            <li key={index}>
                                Student ID: {record.student_id} - Timestamp: {new Date(record.timestamp).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div style={{ marginTop: "20px" }}>
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/login");
                    }}
                    style={{
                        backgroundColor: "red",
                        color: "white",
                        padding: "10px",
                        borderRadius: "5px",
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default InstructorDashboard;