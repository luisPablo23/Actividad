import React from "react";
import BottomNav from "./BottomNav";

const MobileLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-md min-h-screen pb-20">{children}</div>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;