import React, { useEffect, useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearFlowContext } from "../utils/flowStorage";

// Logos
import logoLight from "../assets/images/logo-light.png";
import logoDark from "../assets/images/logo-dark.png";

// ODIN letters (imágenes)
import O from "../assets/odin/O.png";
import D from "../assets/odin/D.png";
import I from "../assets/odin/I.png";
import N from "../assets/odin/N.png";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage]   = useState("");
  const [theme, setTheme]       = useState("light");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false); // ✅ #1

  const navigate = useNavigate();

  useEffect(() => {
    // ✅ #4 Redirigir si ya tiene sesión activa
    const token = localStorage.getItem("token");
    const idusuario = localStorage.getItem("session_idusuario");
    if (token && idusuario) {
      navigate("/acta/qr", { replace: true });
      return;
    }

    const html = document.querySelector("html");
    const currentTheme = html?.getAttribute("data-theme") || "light";
    setTheme(currentTheme);
  }, [navigate]);

  // ✅ #3 Toggle como botón
  const toggleTheme = () => {
    const html = document.querySelector("html");
    const current = html?.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    html?.setAttribute("data-theme", next);
    setTheme(next);
  };

  const handleOlvidePassword = () => {
    Swal.fire({
      icon: "info",
      title: "¿Olvidaste tu contraseña?",
      text: "Contactá al administrador del sistema para restablecer tu acceso.",
      confirmButtonText: "Entendido",
      position: "center",
    });
  };

  const handleLogin = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);

      if (!data || data.success === false) {
        setMessage(data?.message || "Credenciales inválidas");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("Respuesta inválida del servidor (falta token o user)");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      if (data.user?.idusuario) {
        localStorage.setItem("session_idusuario", String(data.user.idusuario));
      }
      if (data.user?.llave) {
        localStorage.setItem("session_llave", String(data.user.llave));
      }

      clearFlowContext();
      navigate("/acta/qr", { replace: true });
    } catch (e) {
      setMessage("Error inesperado en login");
    } finally {
      setLoading(false);
    }
  };

  const logo = theme === "dark" ? logoDark : logoLight;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">

      {/* ✅ #3 Toggle como botón con ícono */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm btn-circle text-lg"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? "🌞" : "🌙"}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-4">

            {/* Logo */}
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Sistema de Actas"
                className="w-20 h-20 object-contain"
                draggable="false"
              />
            </div>

            {/* ODIN con pastilla de fondo */}
            <div className="flex justify-center">
              <div
                className={
                  "inline-flex justify-center items-center gap-1 px-4 py-2 rounded-2xl " +
                  "transition-colors duration-300 " +
                  (theme === "dark"
                    ? "bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                    : "bg-black/5 shadow-[0_0_15px_rgba(0,0,0,0.05)]")
                }
              >
                <img src={O} alt="O" className="h-9 sm:h-10 md:h-11 object-contain" draggable="false" />
                <img src={D} alt="D" className="h-9 sm:h-10 md:h-11 object-contain" draggable="false" />
                <img src={I} alt="I" className="h-9 sm:h-10 md:h-11 object-contain" draggable="false" />
                <img src={N} alt="N" className="h-9 sm:h-10 md:h-11 object-contain" draggable="false" />
              </div>
            </div>

            <p className="text-sm text-center text-base-content/70">
              Ingresa tus credenciales para continuar
            </p>

            {/* Email — sin cambios */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Correo electrónico</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@dominio.com"
                inputMode="email"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* ✅ #1 Password con mostrar/ocultar */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="input input-bordered w-full pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
              <label className="label">
                <span
                  className="label-text-alt text-primary cursor-pointer"
                  onClick={handleOlvidePassword}
                >
                  ¿Olvidaste tu contraseña?
                </span>
              </label>
            </div>

            {/* Botón */}
            <button
              className={"btn btn-primary w-full " + (loading ? "btn-disabled" : "")}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            {message && (
              <div className="alert alert-error py-2 text-sm">
                {message}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;