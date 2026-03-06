import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { getSession, setFlowActa } from "../utils/flowStorage";

const ERRORES = {
  noEncontrada: {
    titulo: "QR no válido",
    detalle: "Este código no corresponde a ningún acta registrada. Verificá el código e intentá de nuevo.",
    icono: "⚠️",
  },
  red: {
    titulo: "Error de conexión",
    detalle: "No se pudo consultar el servidor. Verificá tu conexión a internet e intentá de nuevo.",
    icono: "📡",
  },
  camara: {
    titulo: "Sin acceso a la cámara",
    detalle: "No se pudo iniciar la cámara. Verificá que el navegador tenga permiso para usarla.",
    icono: "📷",
  },
};

const ActaQr = () => {
  const [errorKey, setErrorKey] = useState(null);
  const [escaneando, setEscaneando] = useState(true);
  const [consultando, setConsultando] = useState(false); // ✅ feedback mientras consulta el servidor
  const [actaEncontrada, setActaEncontrada] = useState(null); // ✅ feedback positivo

  const qrRegionId = "qr-reader";
  const html5QrCodeRef = useRef(null);
  const leyendoRef = useRef(false);
  const navigate = useNavigate();

  const iniciarScanner = async (cancelled) => {
    setErrorKey(null);
    setEscaneando(true);
    setConsultando(false);
    setActaEncontrada(null);
    leyendoRef.current = false;

    try {
      if (html5QrCodeRef.current) {
        try { await html5QrCodeRef.current.stop(); } catch (_) {}
      }

      html5QrCodeRef.current = new Html5Qrcode(qrRegionId);

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (cancelled?.value) return;
          if (leyendoRef.current) return;

          leyendoRef.current = true;
          setErrorKey(null);
          setConsultando(true); // ✅ QR detectado, consultando servidor

          // Detener scanner antes de consultar
          try { await html5QrCodeRef.current.stop(); } catch (_) {}

          const { idusuario, llave } = getSession();

          try {
            const res = await axiosClient.post("/selcom_tbl_acta", {
              idusuario,
              llave,
              pCampo0: "Nnumeroacta",
              pValor0: decodedText,
            });

            const items = res?.data?.info?.item ?? [];

            if (items.length > 0) {
              const acta = items[0];

              setFlowActa({
                idacta: acta.idacta,
                numeroacta: acta.numeroacta,
              });

              // ✅ Mostrar feedback positivo brevemente antes de navegar
              setConsultando(false);
              setActaEncontrada(acta.numeroacta);

              setTimeout(() => {
                if (!cancelled?.value) {
                  navigate("/acta/foto", { replace: true });
                }
              }, 2000);

            } else {
              setConsultando(false);
              setErrorKey("noEncontrada");
              setEscaneando(false);
              leyendoRef.current = false;
            }
          } catch (err) {
            console.error("Error consultando acta:", err?.response?.data || err?.message);
            setConsultando(false);
            setErrorKey("red");
            setEscaneando(false);
            leyendoRef.current = false;
          }
        }
      );
    } catch (e) {
      console.warn("No se pudo iniciar la cámara:", e?.message || e);
      setErrorKey("camara");
      setEscaneando(false);
    }
  };

  useEffect(() => {
    const cancelled = { value: false };
    iniciarScanner(cancelled);

    return () => {
      cancelled.value = true;
      try { html5QrCodeRef.current?.stop().catch(() => {}); } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const reintentar = async () => {
    const cancelled = { value: false };
    await iniciarScanner(cancelled);
  };

  const error = errorKey ? ERRORES[errorKey] : null;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-3">Escanear QR del acta</h1>

      {/* Visor del scanner — visible solo mientras escanea */}
      <div
        id={qrRegionId}
        className="rounded-xl overflow-hidden shadow-lg"
        style={{ display: escaneando && !consultando && !actaEncontrada ? "block" : "none" }}
      />

      {/* Instrucción mientras escanea */}
      {escaneando && !consultando && !actaEncontrada && !error && (
        <p className="text-xs text-base-content/50 text-center mt-3">
          Apuntá la cámara al código QR del acta
        </p>
      )}

      {/* ✅ Consultando servidor — spinner */}
      {consultando && (
        <div className="card bg-base-100 shadow border border-base-300">
          <div className="card-body items-center text-center gap-3 py-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <div className="text-sm text-base-content/70">Verificando acta...</div>
          </div>
        </div>
      )}

      {/* ✅ Acta encontrada — feedback positivo */}
      {actaEncontrada && (
        <div className="card bg-base-100 shadow border border-success">
          <div className="card-body items-center text-center gap-3 py-10">
            <div className="text-5xl">✅</div>
            <div>
              <div className="font-bold text-base text-success">Acta encontrada</div>
              <div className="text-sm text-base-content/70 mt-1">
                Nº <b>{actaEncontrada}</b>
              </div>
            </div>
            <div className="text-xs text-base-content/40">Abriendo cámara...</div>
          </div>
        </div>
      )}

      {/* Error con mensaje claro y botón de reintento */}
      {error && (
        <div className="card bg-base-100 shadow border border-base-300 mt-2">
          <div className="card-body items-center text-center gap-3">
            <div className="text-4xl">{error.icono}</div>
            <div>
              <div className="font-bold text-base">{error.titulo}</div>
              <div className="text-sm text-base-content/70 mt-1">{error.detalle}</div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full mt-2"
              onClick={reintentar}
            >
              Escanear de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActaQr;