import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, children }) => {
    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }
    return children; // Render the protected component
};

export default ProtectedRoute;