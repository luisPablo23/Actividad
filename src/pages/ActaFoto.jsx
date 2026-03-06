import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadActaImagen, guardarActaImagen } from "../api/actasImagenes.api";
import { fixRotateAndCompressImage } from "../utils/imageTools";
import { getSession, setLastRegistro } from "../utils/flowStorage";

const ActaFoto = () => {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [fileActual, setFileActual] = useState(null);

  const navigate = useNavigate();
  const inputRef = useRef(null);

  const { idusuario, llave } = getSession();
  const idacta = localStorage.getItem("ultimoQR");
  const numeroActa = localStorage.getItem("ultimoNumeroActa");

  useEffect(() => {
    if (!idacta) {
      navigate("/acta/qr", { replace: true });
    }
  }, [idacta, navigate]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const abrirCamara = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setRotation(0);
    setFileActual(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const rotar = () => setRotation((prev) => (prev + 90) % 360);

  const retomar = () => {
    setPreview(null);
    setFileActual(null);
    setRotation(0);
    setError("");
  };

  const aplicarRotacion = (file, degrees) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const rad = (degrees * Math.PI) / 180;
        const rotate90 = degrees === 90 || degrees === 270;
        const canvas = document.createElement("canvas");
        canvas.width  = rotate90 ? img.naturalHeight : img.naturalWidth;
        canvas.height = rotate90 ? img.naturalWidth  : img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("toBlob devolvió null"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        }, "image/jpeg", 0.95);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const subirFoto = async () => {
    if (!fileActual) return;
    setError("");
    setSubiendo(true);

    try {
      let fileParaComprimir = fileActual;
      if (rotation !== 0) {
        fileParaComprimir = await aplicarRotacion(fileActual, rotation);
      }

      const compressedFile = await fixRotateAndCompressImage(fileParaComprimir);

      const resImg = await uploadActaImagen(Number(idacta), compressedFile);
      const urlimagen = resImg?.data?.urlimagen;

      if (!urlimagen) {
        setError("No se recibió la URL de la imagen desde el backend.");
        setSubiendo(false);
        return;
      }

      const isoUTC   = new Date().toISOString();
      const mysqlUTC = isoUTC.slice(0, 19).replace("T", " ");

      await guardarActaImagen({
        idusuario,
        llave,
        idimagen: 0,
        idacta: Number(idacta),
        urlimagen,
        fechahora: mysqlUTC,
      });

      setLastRegistro(isoUTC, mysqlUTC);
      navigate("/acta/transcripcion", { replace: true });
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la foto. Verificá tu conexión e intentá de nuevo.");
      setSubiendo(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-2">Foto del acta</h1>

      <div className="text-sm text-base-content/70 mb-3">
        {numeroActa ? `Acta: ${numeroActa}` : "Acta seleccionada"}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      {/* Sin foto → área para abrir cámara */}
      {!preview && !subiendo && (
        <div
          onClick={abrirCamara}
          className="w-full rounded-2xl border-2 border-dashed border-base-300 bg-base-100 shadow-md p-6 flex flex-col items-center justify-center min-h-[260px] cursor-pointer active:opacity-70 transition-opacity"
          role="button"
          tabIndex={0}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") abrirCamara();
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-base-content/30 mb-3">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div className="text-sm text-base-content/60 text-center">
            Toca aquí para abrir la cámara y tomar la foto
          </div>
        </div>
      )}

      {/* Subiendo → spinner */}
      {subiendo && (
        <div className="w-full rounded-2xl border border-base-300 bg-base-100 shadow-md p-6 flex flex-col items-center justify-center min-h-[260px]">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <div className="text-sm mt-3">Subiendo foto...</div>
        </div>
      )}

      {/* Con foto → preview + controles */}
      {preview && !subiendo && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex justify-center items-center bg-base-200 rounded-2xl overflow-hidden min-h-[260px]">
            <img
              src={preview}
              alt="Preview"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
                maxWidth: rotation === 90 || rotation === 270 ? "260px" : "100%",
                maxHeight: "320px",
                objectFit: "contain",
              }}
            />
          </div>

          {rotation !== 0 && (
            <div className="text-xs text-base-content/50">Rotación: {rotation}°</div>
          )}

          {/* ✅ Error con opciones de reintento */}
          {error && (
            <div className="w-full">
              <div className="alert alert-error mb-3">
                <span className="text-sm">{error}</span>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={retomar}
                >
                  Retomar foto
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1"
                  onClick={subirFoto}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Botones normales (sin error) */}
          {!error && (
            <div className="flex gap-2 w-full">
              <button type="button" className="btn btn-outline flex-1" onClick={retomar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retomar
              </button>

              <button type="button" className="btn btn-outline flex-1" onClick={rotar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                  <path d="M21 2v6h-6" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 13a9 9 0 1 1-3-7.7L21 8"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Rotar 90°
              </button>

              <button type="button" className="btn btn-primary flex-1" onClick={subirFoto}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                  <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Subir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActaFoto;