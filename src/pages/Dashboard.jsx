import React from "react";

const Dashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Ernesto </h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Dashboard;