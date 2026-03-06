import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Contenido */}
      <div className="mx-auto max-w-md">
        {/* padding-bottom para que no tape el navbar */}
        <div className="pb-24">
          <Outlet />
        </div>
      </div>

      {/* Navbar inferior */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;