import React, { useEffect, useMemo, useState } from "react";
import { getResultadoOficial } from "../api/resultadooficial";

const parseAsUTC = (value) => {
  if (!value) return null;
  // "2025-12-14 20:17:00" -> Date UTC
  return new Date(value.replace(" ", "T") + "Z");
};

const ResultadoOficial = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const idusuario = localStorage.getItem("session_idusuario") || "1";
  const llave = localStorage.getItem("session_llave") || "";

  const cargar = async () => {
    setLoading(true);
    setError("");

    try {
      // 🔧 Acá vos defines filtros reales según campos disponibles en com_vis_resultadooficial
      // ejemplo: filtrar por elección o categoría si existe
      const data = await getResultadoOficial({
        idusuario,
        llave,
        filtros: {
          pCampo0: "T",
          pValor0: "",
        },
      });

      const list = data?.info?.item ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar resultados oficiales.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Ajustá estos nombres a las columnas reales que devuelva com_vis_resultadooficial
  const rows = useMemo(() => {
    return items.map((r) => ({
      // si tu vista ya trae sigla/nombre, usalos
      sigla: r.sigla || r.partido || r.idpartido || "-",
      nombre: r.nombres || r.candidato || r.nombrecandidato || r.idcandidato || "-",
      votos: Number(r.votos ?? 0),
      fechavalidacion: r.fechavalidacion || r.fecharegistro || null,
    }));
  }, [items]);

  const totalVotos = useMemo(
    () => rows.reduce((acc, r) => acc + (Number.isFinite(r.votos) ? r.votos : 0), 0),
    [rows]
  );

  const fechaServidor = useMemo(() => {
    // intenta agarrar la fecha del primer item
    const any = rows.find((r) => r.fechavalidacion)?.fechavalidacion;
    const d = parseAsUTC(any);
    return d ? d.toLocaleString() : "-";
  }, [rows]);

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto flex justify-center mt-10">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Resultados Oficiales</h1>
        <button className="btn btn-ghost btn-sm" onClick={cargar}>↻</button>
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="text-sm text-base-content/70">Total votos (sumatoria)</div>
          <div className="text-2xl font-bold">{totalVotos.toLocaleString()}</div>

          <div className="divider my-2" />

          <div className="text-xs text-base-content/60">
            Fecha y hora del servidor: <b>{fechaServidor}</b>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="font-semibold mb-2">Detalle</h2>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Sigla</th>
                  <th>Candidato</th>
                  <th className="text-right">Votos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-outline">{r.sigla}</span>
                    </td>
                    <td className="font-medium">{r.nombre}</td>
                    <td className="text-right font-mono">{r.votos.toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-base-content/60">
                      Sin datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultadoOficial;