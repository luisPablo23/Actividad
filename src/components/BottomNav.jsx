import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { clearFlowContext } from "../utils/flowStorage";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Activo en todo el flujo del acta (qr, foto, transcripcion, observaciones)
  const enFlujoActa = location.pathname.startsWith("/acta/");
  const enPanel = location.pathname === "/panel";

  const itemStyle = (activo) =>
    `flex flex-col items-center justify-center w-full py-2 transition-colors ${
      activo ? "text-primary" : "text-base-content/70"
    }`;

  const logout = () => {
    localStorage.removeItem("session_idusuario");
    localStorage.removeItem("session_llave");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    clearFlowContext();
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="bg-base-100 border-t border-base-300 shadow-[0_-6px_20px_-18px_rgba(0,0,0,0.6)]">
          <div className="grid grid-cols-3">

            {/* ✅ QR — activo en todo el flujo /acta/* */}
            <NavLink
              to="/acta/qr"
              className={itemStyle(enFlujoActa)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 8h3v3H8V8ZM13 8h3v3h-3V8ZM8 13h3v3H8v-3ZM13 13h3v3h-3v-3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-xs mt-1">Acta</span>
            </NavLink>

            {/* Panel */}
            <NavLink
              to="/panel"
              className={itemStyle(enPanel)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-1">Panel</span>
            </NavLink>

            {/* Salir */}
            <button
              type="button"
              onClick={logout}
              className="flex flex-col items-center justify-center w-full py-2 text-error transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 12h10M7 8l-4 4 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-1">Salir</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;