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
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      // Retrieve token and user data from localStorage
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Log the user object for debugging
      console.log("User Object from localStorage:", user);

      // Validate user and token
      if (!token) {
        console.log("Validation failed: Missing token.");
        setError("Unauthorized: Please log in again.");
        return;
      }

      if (!user?.id) {
        console.log("Validation failed: Missing user ID.");
        setError("Unauthorized: User ID is missing. Please log in again.");
        return;
      }

      if (user?.role !== "student") {
        console.log("Validation failed: Invalid role.");
        setError("Unauthorized: Only students can mark attendance.");
        return;
      }

      // Validate session_id
      if (!session_id) {
        console.log("Validation failed: Invalid session_id.");
        setError("Invalid session ID. Please scan a valid QR code.");
        return;
      }

      // Prepare the request body
      const requestBody = {
        session_id: session_id,
      };

      // Log the request body and token for debugging
      console.log("Request Body:", requestBody);
      console.log("Token:", token);

      // Make API call to mark attendance
      const response = await axios.post(
        "https://classattendanceqrcodesystem.onrender.com/api/attendance",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Log the API response for debugging
      console.log("API Response:", response);

      // Handle API response
      if (response.status === 201) {
        setSuccessMessage("Attendance marked successfully!");
        alert("Attendance marked successfully!");
      } else {
        setError("Error marking attendance. Please try again.");
      }
    } catch (error) {
      console.error("API Error Details:", error);
      if (error.response) {
        setError(error.response.data?.error || "An error occurred while marking attendance.");
      } else if (error.request) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      setScannedData("");
    }
  };

  // Start & Stop Camera feed
  const startCamera = async () => {
    try {
      console.log("Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream; // Store the stream to stop it later
      setCameraStarted(true); // Start camera feed
      console.log("Camera started successfully.");
    } catch (error) {
      console.error("Error accessing the camera: ", error.name, error.message);
      setError("Unable to access the camera. Please check your permissions and ensure your camera is connected.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      console.log("Stopping camera...");
      const tracks = mediaStreamRef.current.getTracks();
      tracks.forEach((track) => track.stop()); // Stop all tracks
      mediaStreamRef.current = null; // Clear the media stream reference
    }
    setCameraStarted(false); // Stop camera feed
    console.log("Camera stopped.");
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      stopCamera();
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="student-dashboard">
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
          <QrReader
            constraints={{
              facingMode: "environment", // Use the rear camera
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
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default StudentDashboard;