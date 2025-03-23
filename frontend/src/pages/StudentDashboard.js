import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const checkCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("Camera access granted");
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Camera access denied:", err);
        setError("Unable to access the camera. Please check your permissions and ensure your camera is connected.");
      }
    };
    checkCamera();
  }, []);

  const handleScan = (result) => {
    if (result?.text) {
      console.log("Scanned QR Data:", result.text);
      let session_id = extractSessionId(result.text);
      console.log("Extracted Session ID:", session_id);
      if (session_id) {
        setScannedData(session_id);
        handleMarkAttendance(session_id);
        stopCamera();
        setError("");
        setSuccessMessage("QR Code Scanned Successfully! Marking attendance...");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
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
      return parsedData.session_id || null;
    } catch (error) {
      const match = text.match(/\/?session\/(\d+)/);
      return match ? match[1] : null;
    }
  };

  const handleMarkAttendance = async (session_id) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!token || !user?.id || user?.role !== "student") {
        setError("Unauthorized: Only students can mark attendance.");
        return;
      }

      console.log("Attempting to mark attendance for session:", session_id);
      console.log("User Info:", user);

      const response = await axios.post(
        "https://classattendanceqrcodesystem.onrender.com/api/attendance",
        { session_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response);

      if (response.data.message) {
        alert(response.data.message);
      } else {
        setError("Error marking attendance. Please try again.");
      }
      setScannedData("");
    } catch (error) {
      console.error("API Error:", error);
      setError(error.response?.data?.error || "Error marking attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = () => {
    setCameraStarted(true);
  };

  const stopCamera = () => {
    setCameraStarted(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="student-dashboard" style={{ padding: "20px" }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, Student! Scan the QR code to mark your attendance.</p>

      <button
        onClick={cameraStarted ? stopCamera : startCamera}
        style={{
          marginBottom: "10px",
          padding: "10px 20px",
          backgroundColor: cameraStarted ? "#dc3545" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {cameraStarted ? "Stop Scanning" : "Scan QR Code"}
      </button>

      {cameraStarted && (
        <div className="camera-container">
          <h3>Scan QR Code</h3>
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

      {loading && <p style={{ color: "blue" }}>Loading...</p>}

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {successMessage && (
        <div style={{ color: "green", marginTop: "10px" }}>
          {successMessage}
        </div>
      )}

      <button
        onClick={handleLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default StudentDashboard;