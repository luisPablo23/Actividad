import React, { useEffect, useMemo, useState } from "react";
import { getResultadosTranscripcion } from "../api/resultadotranscripcion";
import { getSession } from "../utils/flowStorage";

const formatLocal = (d) => {
  if (!d) return "-";
  return new Intl.DateTimeFormat("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
};

const parseUTC = (value) => {
  if (!value) return null;
  // Soporta "YYYY-MM-DD HH:mm:ss" y ISO con Z
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Deduplica actas: queda solo el registro más reciente por numeroacta
const deduplicarActas = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const key = item.numeroacta || item.idacta;
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
};

const Panel = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Registro recién hecho en este flujo (antes de que llegue el fetch)
  const ultimoLocal = useMemo(() => {
    const numeroActa = localStorage.getItem("ultimoNumeroActa");
    const fechaHoraUTC = localStorage.getItem("ultimoRegistroFechaHora");
    const isoUTC = localStorage.getItem("ultimoRegistroISO");
    if (!numeroActa) return null;
    return { numeroActa, fechaHoraUTC, isoUTC };
  }, []);

  useEffect(() => {
    // Limpiar flujo al llegar al panel
    localStorage.removeItem("ultimoQR");
    localStorage.removeItem("ultimoNumeroActa");
    localStorage.removeItem("ultimoRegistroFechaHora");
    localStorage.removeItem("ultimoRegistroISO");

    const cargar = async () => {
      setLoading(true);
      setError("");

      const { idusuario, llave } = getSession();

      try {
        const res = await getResultadosTranscripcion({
          idusuario,
          llave,
          pCampo0: "Nidusuario",
          pValor0: idusuario,
        });

        const items = res?.info?.item ?? [];
        const dedup = deduplicarActas(Array.isArray(items) ? items : []);
        setHistorial(dedup.slice(0, 50));
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar el historial.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  // Último registro: primero el local (inmediato), luego el del servidor
  const ultimo = useMemo(() => {
    if (ultimoLocal) return ultimoLocal;
    if (historial.length === 0) return null;
    const h = historial[0];
    return {
      numeroActa: h.numeroacta || h.idacta,
      fechaHoraUTC: h.fecharegisto || h.fecharegistro || "",
      isoUTC: "",
    };
  }, [ultimoLocal, historial]);

  const ultimoDate = useMemo(() => {
    if (!ultimo) return null;
    return parseUTC(ultimo.isoUTC || ultimo.fechaHoraUTC);
  }, [ultimo]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-lg font-bold mb-3">Panel</h1>

      {/* Último registro */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="text-sm text-base-content/70 mb-2">Último registro</div>

          {ultimo ? (
            <div className="text-base">
              <div>Número de acta: <b>{ultimo.numeroActa || "-"}</b></div>
              <div className="mt-1">
                Fecha UTC: <b>{ultimo.fechaHoraUTC || "-"}</b>
              </div>
              <div className="mt-1 text-sm text-base-content/70">
                Hora local: <b>{ultimoDate ? formatLocal(ultimoDate) : "-"}</b>
              </div>
            </div>
          ) : (
            <div className="text-xs text-base-content/60">
              Todavía no registraste ninguna acta.
            </div>
          )}
        </div>
      </div>

      {/* Historial del servidor */}
      <div className="mt-4">
        <div className="text-sm text-base-content/70 mb-2">Historial</div>

        {loading && (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error text-sm">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && historial.length === 0 && (
          <div className="text-xs text-base-content/60">Sin registros todavía.</div>
        )}

        {!loading && !error && historial.length > 0 && (
          <div className="space-y-2">
            {historial.map((h, idx) => {
              const fecha = parseUTC(h.fecharegisto || h.fecharegistro || "");
              return (
                <div
                  key={`${h.idacta}-${h.idtranscripcion}-${idx}`}
                  className="border border-base-300 rounded-xl p-3 bg-base-100"
                >
                  <div className="text-sm">
                    Acta: <b>{h.numeroacta || h.idacta}</b>
                  </div>
                  <div className="text-xs text-base-content/70 mt-1">
                    {fecha ? formatLocal(fecha) : (h.fecharegisto || "-")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Panel;