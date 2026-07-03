import { Outlet } from "react-router-dom";

 const ProtectedRoute = () => {
    // AUTH BYPASS: remove this and restore original for production
    return <Outlet />;
};

export default ProtectedRoute
