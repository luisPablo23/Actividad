import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { guardarResultadosTranscripcion } from "../api/resultadotranscripcion";
import { guardarObservacion } from "../api/observaciones.api";
import { getSession, clearFlowContext } from "../utils/flowStorage";

const MAX_VOTOS = 220;

const sanitizeDigits = (v, max = MAX_VOTOS) => {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  if (s === "") return "0";
  const n = Number(s);
  if (!Number.isFinite(n)) return "0";
  return String(Math.min(n, max));
};

const readDraft = () => {
  try {
    return JSON.parse(localStorage.getItem("draft_transcripcion") || "null");
  } catch {
    return null;
  }
};

const Observaciones = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [observacion, setObservacion] = useState("");

  const draft = useMemo(() => readDraft(), []);
  const numeroActa = localStorage.getItem("ultimoNumeroActa") || "";
  const idacta = localStorage.getItem("ultimoQR") || "";
  const { idusuario, llave } = getSession();

  const cancelar = () => {
    if (saving) return;
    navigate("/acta/transcripcion", { replace: true });
  };

  const aceptar = async () => {
    if (saving) return;

    if (!draft?.resultados?.length) {
      Swal.fire({
        icon: "error",
        title: "No hay datos",
        text: "No se encontró la transcripción. Volvé a transcribir.",
        position: "center",
      });
      navigate("/acta/transcripcion", { replace: true });
      return;
    }

    const r = await Swal.fire({
      title: "Confirmar",
      text: "¿Guardar la transcripción de esta acta?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Volver",
      reverseButtons: true,
      position: "center",
    });

    if (!r.isConfirmed) return;

    setSaving(true);
    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      position: "center",
    });

    try {
      // 1) Guardar transcripción en BD
      await guardarResultadosTranscripcion({
        resultados: draft.resultados.map((r) => ({
          idacta: r.idacta,
          idcandidatura: r.idcandidatura,
          idpartido: r.idpartido,
          votos: Number(sanitizeDigits(r.votos) || 0),
          idusuario,
        })),
      });

      // 2) Guardar observación solo si el usuario escribió algo
      if (observacion.trim()) {
        await guardarObservacion({
          idusuario,
          llave,
          idacta: Number(idacta),
          observacion: observacion.trim(),
        });
      }

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Guardado",
        timer: 900,
        showConfirmButton: false,
        position: "center",
      });

      // 3) Limpiar draft — el flujo lo limpia Panel
      localStorage.removeItem("draft_transcripcion");

      navigate("/panel", { replace: true });
    } catch (e) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: "Intenta nuevamente.",
        position: "center",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">

          {/* Número de acta */}
          <div className="mb-2">
            <div className="text-xs text-base-content/60">Acta</div>
            <div className="text-lg font-bold">{numeroActa || "—"}</div>
          </div>

          {/* Campo de observaciones */}
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text font-semibold">Observaciones</span>
              <span className="label-text-alt text-base-content/50">Opcional</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              placeholder="Ingresá cualquier observación sobre esta acta antes de confirmar..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={saving}
              maxLength={500}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/40">
                {observacion.length}/500
              </span>
            </label>
          </div>

          {/* Alerta si no hay draft */}
          {!draft?.resultados?.length && (
            <div className="alert alert-warning mt-2">
              <span>No hay transcripción cargada. Volvé a la pantalla anterior.</span>
            </div>
          )}

          {/* Botones */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={cancelar}
              disabled={saving}
            >
              Volver
            </button>

            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={aceptar}
              disabled={saving || !draft?.resultados?.length}
            >
              Confirmar y guardar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Observaciones;