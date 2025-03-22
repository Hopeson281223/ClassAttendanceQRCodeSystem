import React, { useState, useEffect, useRef } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [scannedData, setScannedData] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null);

    // Check Camera permissions and availability
    useEffect(() => {
        const checkCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                mediaStreamRef.current = stream; // Store the stream to stop it later
                console.log("Camera access granted");
                stream.getTracks().forEach((track) => track.stop()); // Immediately stop the stream after checking
            } catch (err) {
                console.error("Camera access denied:", err);
                setError("Unable to access the camera. Please check your permissions and ensure your camera is connected.");
            }
        };
        checkCamera();
    }, []);

    // Handle QR scan results
    const handleScan = (result) => {
        if (result?.text) {
            console.log("Scanned QR Data:", result.text);

            const session_id = extractSessionId(result.text); // Extract session_id
            console.log("Extracted Session ID:", session_id);

            if (session_id) {
                setScannedData(session_id);
                handleMarkAttendance(session_id); // Mark attendance using session_id
                stopCamera(); // Stop the camera feed after successful scan
                setError(""); // Clear any previous errors

                setSuccessMessage("QR Code Scanned Successfully! Marking attendance...");
                setTimeout(() => setSuccessMessage(""), 3000); // Auto hide success message after 3 seconds
            } else {
                setError("Invalid QR code format. Please scan a valid code.");
            }
        } else {
            console.log("No QR code detected");
            setError("No QR code detected. Please try again.");
        }
    };

    const handleError = (err) => {
        console.error("QR Scanner Error:", err);
        setError("An error occurred while scanning the QR code. Please try again.");
    };

    const extractSessionId = (text) => {
        try {
            const parsedData = JSON.parse(text);
            return parsedData.session_id || null; // Extract session_id from JSON
        } catch (error) {
            const match = text.match(/\/?session\/(\d+)/); // Extract session_id from URL
            return match ? match[1] : null;
        }
    };

    // Mark Attendance
    const handleMarkAttendance = async (session_id) => {
        setLoading(true);
        setError(""); // Clear any previous error
        setSuccessMessage(""); // Clear any previous success message

        try {
            // Retrieve token and user data from localStorage
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            // Validate user and token
            if (!token || !user?.user_id || user?.role !== "student") {
                setError("Unauthorized: Only students can mark attendance.");
                return;
            }
             
            // Validate session_id
            if (!session_id) {
                setError("Invalid session ID. Please scan a valid QR code.");
                return;
            }

            console.log("Data type of session_id bfr sessionIdString:", typeof session_id, session_id)            
            // Ensure session_id is a string
            const sessionIdString = String(session_id); // Convert session_id to a string

            console.log("Data type of session_id aftr sessionIdString:", typeof session_id, session_id)
        
            // Prepare the request body
            const requestBody = {
                session_id: sessionIdString, // Ensure the value is a string
            };

            // Make API call to mark attendance
            const response = await axios.post(
                "https://classattendanceqrcodesystem.onrender.com/api/attendance",
                requestBody, // Send the correctly formatted body
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Handle API response
            if (response.status === 201) {
                setSuccessMessage("Attendance marked successfully!");
                alert("Attendance marked successfully!");
            } else {
                setError("Error marking attendance. Please try again.");
            }
        } catch (error) {
            console.error("API Error:", error);

            // Handle specific error cases
            if (error.response) {
                // Server responded with an error status code (4xx or 5xx)
                const errorMessage = error.response.data?.error || "An error occurred while marking attendance.";
                setError(errorMessage);
            } else if (error.request) {
                // The request was made but no response was received
                setError("Network error. Please check your internet connection.");
            } else {
                // Something else went wrong
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
            setScannedData(""); // Clear scanned data after marking attendance
        }
    };

    // Start & Stop Camera feed
    const startCamera = () => {
        setCameraStarted(true); // Start camera feed
    };

    const stopCamera = () => {
        setCameraStarted(false); // Stop camera feed
        if (mediaStreamRef.current) {
            const tracks = mediaStreamRef.current.getTracks();
            tracks.forEach((track) => track.stop()); // Stop all tracks
        }
    };

    const getCameraFeed = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Error accessing the camera: ", error);
        }
    };

    useEffect(() => {
        if (cameraStarted) {
            getCameraFeed();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [cameraStarted]);

    // Logout
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            stopCamera();
            localStorage.clear();
            navigate("/login");
        }
    };

    return (
        <div className="dashboard-container">
            <h1 className="title">Student Dashboard</h1>
            <p className="welcome-message">Welcome, Student! Scan the QR code to mark your attendance.</p>

            {/* Start/Stop Camera Button */}
            <button
                onClick={cameraStarted ? stopCamera : startCamera}
                className={`action-btn ${cameraStarted ? "stop-btn" : "start-btn"}`}
            >
                {cameraStarted ? "Stop Scanning" : "Scan QR Code"}
            </button>

            {/* Camera and QR Reader */}
            {cameraStarted && (
                <div className="camera-container">
                    <h3 className="camera-header">Scan QR Code</h3>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        width="100%"
                        height="auto"
                        className="camera-feed"
                    />
                    <QrReader
                        constraints={{
                            facingMode: "environment",
                            width: { ideal: 400 },
                            height: { ideal: 300 },
                        }}
                        onResult={handleScan}
                        onError={handleError}
                        className="qr-reader"
                    />
                </div>
            )}

            {/* Loading, Error, and Success Messages */}
            {loading && <p className="loading-message">Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {/* Logout Button */}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
    );
};

export default StudentDashboard;