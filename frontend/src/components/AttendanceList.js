import { useState, useEffect } from "react";
import "../App.css";

const AttendanceList = ({ userId }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setError("Unauthorized access. Please log in.");
            setLoading(false);
            return;
        }

        const fetchAttendance = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/attendance?user_id=${userId}`);
                if (!res.ok) throw new Error("Failed to fetch attendance data");

                const data = await res.json();
                setAttendance(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [userId]);

    return (
        <div>
            <h2>Attendance List</h2>
            {loading ? (
                <p>Loading attendance...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : attendance.length === 0 ? (
                <p>No attendance records found.</p>
            ) : (
                <ul>
                    {attendance.map((record, index) => (
                        <li key={index}>
                            Session: {record.session_id} | Date: {new Date(record.timestamp).toLocaleString()}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AttendanceList;
