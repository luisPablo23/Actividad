export const getSession = () => {
  const idusuario = localStorage.getItem("session_idusuario") || "1";
  const llave = localStorage.getItem("session_llave") || "";
  return { idusuario, llave };
};

export const setFlowActa = ({ idacta, numeroacta }) => {
  localStorage.setItem("ultimoQR", String(idacta));
  localStorage.setItem("ultimoNumeroActa", String(numeroacta ?? ""));
};

// ✅ Centraliza las dos keys de fecha/hora en un solo lugar
export const setLastRegistro = (isoUTC, mysqlUTC) => {
  localStorage.setItem("ultimoRegistroISO", isoUTC);
  localStorage.setItem("ultimoRegistroFechaHora", mysqlUTC);
};

// ✅ Ahora limpia todas las keys del flujo, incluyendo las de fecha
export const clearFlowContext = () => {
  localStorage.removeItem("ultimoQR");
  localStorage.removeItem("ultimoNumeroActa");
  localStorage.removeItem("ultimoRegistroFechaHora");
  localStorage.removeItem("ultimoRegistroISO");
};

export const appendHistorialActa = ({ numeroacta, fechaHoraUtc, idacta }) => {
  const key = "historialActas";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  const next = [
    {
      idacta: Number(idacta),
      numeroacta: String(numeroacta ?? ""),
      fechaHoraUtc: String(fechaHoraUtc ?? ""),
    },
    ...prev,
  ];
  localStorage.setItem(key, JSON.stringify(next));
};

export const getHistorialActas = () => {
  return JSON.parse(localStorage.getItem("historialActas") || "[]");
};