import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import "./App.css";

const App = () => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [role, setRole] = useState(localStorage.getItem("role")?.toLowerCase());

    // Update state when local storage changes
    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem("token"));
            setRole(localStorage.getItem("role")?.toLowerCase());
        };

        // Listen for changes to local storage
        window.addEventListener("storage", handleStorageChange);

        // Cleanup listener
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const isAuthenticated = !!token;
    const isAdmin = isAuthenticated && role === "admin";
    const isInstructor = isAuthenticated && role === "instructor";
    const isStudent = isAuthenticated && role === "student";

    console.log("App Role:", role);
    console.log("isAdmin:", isAdmin);
    console.log("isInstructor:", isInstructor);
    console.log("isStudent:", isStudent);

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Dashboard */}
            <Route
                path="/admin-dashboard"
                element={
                    <ProtectedRoute user={isAdmin}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Instructor Dashboard */}
            <Route
                path="/instructor-dashboard"
                element={
                    <ProtectedRoute user={isInstructor}>
                        <InstructorDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Student Dashboard */}
            <Route
                path="/student-dashboard"
                element={
                    <ProtectedRoute user={isStudent}>
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default App;