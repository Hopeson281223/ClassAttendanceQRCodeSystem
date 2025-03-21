import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../App.css";  // Import your CSS file

const ROLES = {
    ADMIN: "admin",
    INSTRUCTOR: "instructor",
    STUDENT: "student",
};

const Login = () => {
    const [user, setUser] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Clear previous session data on page load
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user"); // Clear previous user data
        console.log("✅ Local storage cleared on login page load.");
    }, []);

    const handleLogin = async () => {
        if (!user.email || !user.password) {
            alert("⚠️ Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });

            const data = await res.json();
            console.log("🔹 Login Response:", data);

            if (res.ok) {
                if (!data.token) {
                    alert("⚠️ Invalid server response. Missing token.");
                    return;
                }

                const decoded = jwtDecode(data.token);
                console.log("🔍 Decoded Token:", decoded);

                // Extract role and user ID from the decoded token
                const role = decoded?.role; // Role is directly in the token
                const userId = decoded?.sub; // User ID is stored in the `sub` field

                if (!role || !userId) {
                    console.error("❌ Missing role or user ID in token.");
                    alert("⚠️ Login failed: No role or user ID found in token.");
                    return;
                }

                // Save token, role, user ID, and user data to localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", role); // Use role from the token
                localStorage.setItem("user", JSON.stringify({ id: userId, role })); // Use userId and role from the token

                console.log("Token:", data.token); // Log token value
                console.log("Role:", role); // Log role
                console.log("User ID:", userId); // Log user ID
                console.log("User:", { id: userId, role }); // Log user object with ID and role

                window.dispatchEvent(new Event("storage")); // Notify other components...

                alert("✅ Login successful!");

                switch (role) {
                    case ROLES.ADMIN:
                        navigate("/admin-dashboard", { replace: true });
                        break;
                    case ROLES.INSTRUCTOR:
                        navigate("/instructor-dashboard", { replace: true });
                        break;
                    case ROLES.STUDENT:
                        navigate("/student-dashboard", { replace: true });
                        break;
                    default:
                        navigate("/dashboard", { replace: true });
                }
            } else {
                alert(data.error || "❌ Login failed.");
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            alert("⚠️ An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle "Enter" key press for login
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <input
                type="email"
                placeholder="Email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                onKeyPress={handleKeyPress}
                className="input-field"
            />
            <input
                type="password"
                placeholder="Password"
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
                onKeyPress={handleKeyPress}
                className="input-field"
            />
            <button onClick={handleLogin} disabled={loading} className="btn-login">
                {loading ? "Logging in..." : "Login"}
            </button>

            <p>
                Don't have an account? <Link to="/register" className="link">Register here</Link>
            </p>
        </div>
    );
};

export default Login;
