import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

const Register = () => {
    const [user, setUser] = useState({ 
        username: "", 
        email: "", 
        password: "", 
        role: "student" // Default role in lowercase
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (!user.username.trim() || !user.email.trim() || !user.password.trim()) {
            alert("All fields are required.");
            return;
        }
    
        if (!/^\S+@\S+\.\S+$/.test(user.email)) {
            alert("Enter a valid email address.");
            return;
        }
    
        if (user.password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
    
        setLoading(true);
        console.log("Sending data:", user); // Debugging
    
        try {
            const res = await fetch("http://localhost:5000/api/register", {  // Updated URL
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });
    
            const data = await res.json();
    
            if (res.ok) {
                alert("Registration successful! Redirecting to login...");
                navigate("/login");
            } else {
                alert(data.error || "Registration failed.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <input 
                type="text"
                placeholder="Username" 
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value.trim() })} 
            />
            <input 
                type="email"
                placeholder="Email" 
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value.trim() })} 
            />
            <input 
                type="password"
                placeholder="Password" 
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })} 
            />

            {/* Role selection dropdown */}
            <select 
                onChange={(e) => setUser({ ...user, role: e.target.value.toLowerCase() })} // Ensure lowercase
                value={user.role}
            >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
            </select>

            <button onClick={handleRegister} disabled={loading}>
                {loading ? "Registering..." : "Register"}
            </button>

            {/* Login Link */}
            <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
    );
};

export default Register;
