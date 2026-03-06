import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  getResultadosTranscripcion,
  guardarResultadosTranscripcion,
} from "../api/resultadotranscripcion";
import { getSession, clearFlowContext } from "../utils/flowStorage";

const CANDIDATURAS_NOMBRE = {
  1: "GOBERNADOR(A)",
  2: "ASAMBLEISTA TERRITORIO",
  3: "ASAMBLEISTA POBLACIÓN",
};

const MAX_VOTOS = 220;

const mostrarLoading = (titulo) => {
  Swal.fire({
    title: titulo,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
    position: "center",
  });
};

const toastCentro = (icon, title, ms = 1200) => {
  Swal.fire({
    icon,
    title,
    timer: ms,
    showConfirmButton: false,
    position: "center",
  });
};

const deduplicar = (items) => {
  const map = new Map();
  items.forEach((i) => {
    if (!map.has(i.idtranscripcion)) map.set(i.idtranscripcion, i);
  });
  return Array.from(map.values());
};

const sanitizeDigits = (v, max = MAX_VOTOS) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  if (s === "") return "";
  const n = Number(s);
  if (!Number.isFinite(n)) return "";
  return String(Math.min(n, max));
};

const ResultadoTranscripcionList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [index, setIndex] = useState(0);

  const lastMaxToastRef = useRef(0);
  const navigate = useNavigate();

  const { idusuario, llave } = getSession();
  const idacta = localStorage.getItem("ultimoQR");
  const numeroActa = localStorage.getItem("ultimoNumeroActa"); // ✅ para mostrar en header

  useEffect(() => {
    if (!idacta) {
      navigate("/acta/qr", { replace: true });
      return;
    }

    const cargar = async () => {
      setLoading(true);
      mostrarLoading("Cargando transcripción...");

      try {
        const res = await getResultadosTranscripcion({
          idusuario,
          llave,
          pCampo0: "Nidacta",
          pValor0: idacta,
        });

        const items = deduplicar(res?.info?.item || []).map((r) => ({
          ...r,
          votos:
            r.votos === null || r.votos === undefined
              ? ""
              : sanitizeDigits(String(Number(r.votos))),
        }));

        setData(items);
        setIndex(0);
        Swal.close();
      } catch (e) {
        Swal.close();
        toastCentro("error", "Error al cargar datos", 1500);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [idacta, idusuario, llave, navigate]);

  const candidaturas = useMemo(() => {
    return [...new Set(data.map((d) => d.idcandidatura))];
  }, [data]);

  const candidaturaActual = candidaturas[index];
  const filas = data.filter((d) => d.idcandidatura === candidaturaActual);
  const nombreCandidatura = CANDIDATURAS_NOMBRE[candidaturaActual] || "Candidatura";
  const isLast = index >= candidaturas.length - 1;
  const isFirst = index <= 0;
  const total = candidaturas.length; // ✅ total de candidaturas

  const onChangeVoto = (id, value) => {
    const rawDigits = String(value ?? "").replace(/[^\d]/g, "");

    if (rawDigits !== "" && Number(rawDigits) > MAX_VOTOS) {
      const now = Date.now();
      if (now - lastMaxToastRef.current > 800) {
        lastMaxToastRef.current = now;
        toastCentro("info", `Máximo ${MAX_VOTOS}`, 900);
      }
    }

    const cleaned = sanitizeDigits(value);
    setData((prev) =>
      prev.map((r) =>
        r.idtranscripcion === id ? { ...r, votos: cleaned } : r
      )
    );
  };

  const onBlurVoto = (id, value) => {
    const cleaned = sanitizeDigits(value);
    const normalized = cleaned === "" ? "0" : cleaned;
    setData((prev) =>
      prev.map((r) =>
        r.idtranscripcion === id ? { ...r, votos: normalized } : r
      )
    );
  };

  const irAnterior = async () => {
    if (saving) return;
    const r = await Swal.fire({
      title: "¿Volver a la candidatura anterior?",
      text: "Los votos ingresados en esta candidatura no se guardarán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, volver",
      cancelButtonText: "Quedarme",
      reverseButtons: true,
      position: "center",
    });
    if (!r.isConfirmed) return;
    if (!isFirst) setIndex((p) => p - 1);
  };

  const cancelar = async () => {
    if (saving) return;

    const r = await Swal.fire({
      title: "Cancelar transcripción",
      text: "Se perderá el flujo actual de esta acta.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      reverseButtons: true,
      position: "center",
    });

    if (!r.isConfirmed) return;

    clearFlowContext();
    navigate("/panel", { replace: true });
  };

  const guardarOSiguiente = async () => {
    if (saving) return;
    setSaving(true);

    try {
      mostrarLoading(isLast ? "Guardando..." : "Guardando y avanzando...");

      await guardarResultadosTranscripcion({
        resultados: filas.map((r) => {
          const votosSeguro = Math.min(
            Number(sanitizeDigits(r.votos) || 0),
            MAX_VOTOS
          );
          return {
            idacta: r.idacta,
            idcandidatura: r.idcandidatura,
            idpartido: r.idpartido,
            votos: votosSeguro,
            idusuario,
          };
        }),
      });

      Swal.close();
      toastCentro("success", "Guardado", 900);

      if (!isLast) {
        setIndex((p) => p + 1);
      } else {
        navigate("/panel", { replace: true });
      }
    } catch (e) {
      Swal.close();
      toastCentro("error", "No se pudo guardar", 1500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">

          {/* ✅ Header: número de acta + progreso */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-xs text-base-content/50">Acta</div>
              <div className="font-bold text-base">{numeroActa || "—"}</div>
            </div>
            {total > 0 && (
              <div className="text-right">
                <div className="text-xs text-base-content/50">Candidatura</div>
                <div className="font-bold text-base text-primary">
                  {index + 1} / {total}
                </div>
              </div>
            )}
          </div>

          {/* ✅ Barra de progreso */}
          {total > 0 && (
            <div className="w-full bg-base-200 rounded-full h-1.5 mb-3">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          )}

          {/* Nombre de la candidatura */}
          <div className="mb-3">
            <div className="text-sm font-semibold text-base-content">
              {nombreCandidatura}
            </div>
          </div>

          {/* Filas de votos */}
          <div className="space-y-3">
            {filas.map((r) => {
              const num = Number(r.votos || 0);
              const isMax = num === MAX_VOTOS;

              return (
                <div
                  key={r.idtranscripcion}
                  className="flex items-center justify-between border border-base-300 rounded-xl p-3"
                >
                  <div className="min-w-[90px]">
                    <span className="badge badge-outline">{r.sigla}</span>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={
                      "input input-bordered w-28 text-center text-lg " +
                      (isMax ? "input-warning" : "")
                    }
                    value={r.votos ?? ""}
                    onChange={(e) => onChangeVoto(r.idtranscripcion, e.target.value)}
                    onBlur={(e) => onBlurVoto(r.idtranscripcion, e.target.value)}
                    placeholder="0"
                    aria-label={`Votos para ${r.sigla}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Botones */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={cancelar}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={irAnterior}
              disabled={saving || isFirst}
            >
              Anterior
            </button>

            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={guardarOSiguiente}
              disabled={saving}
            >
              {isLast ? "Guardar" : "Siguiente"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultadoTranscripcionList;