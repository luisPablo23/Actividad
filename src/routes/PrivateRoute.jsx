import React from "react";
import { Navigate } from "react-router-dom";

const hasSession = () => {
  return Boolean(localStorage.getItem("token"));
};

const PrivateRoute = ({ children }) => {
  if (!hasSession()) return <Navigate to="/" replace />;
  return children;
};

export default PrivateRoute;
