import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // 💡 Replace this with your actual verifyLogin logic, Context, or Redux state
  const isAuthenticated = localStorage.getItem("octave_token"); // Simple example
  console.log("ProtectedRoute - isAuthenticated:", !!isAuthenticated);
  
  // Optional: If you have a loading state while verifying the token, handle it here
  // if (isLoading) return <div>Loading...</div>;

  // If they aren't logged in, redirect to /login and replace the history stack
  if (!isAuthenticated) {
    return <Navigate to="/send-otp" replace />;
  }

  // If they are logged in, render the requested protected route
  return <Outlet />;
};

export default ProtectedRoute;