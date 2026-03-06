import axiosClient from "./axiosClient";

/**
 * 1) SUBIR IMAGEN FÍSICA (multipart/form-data)
 * Backend: POST /uploadactaimagen
 * PHP espera:
 * - POST.idacta
 * - FILES.imagen
 * Respuesta esperada: { mesaje, urlimagen }
 */
export const uploadActaImagen = (idacta, file) => {
  const form = new FormData();
  form.append("idacta", idacta);
  form.append("imagen", file);

  return axiosClient.post("/uploadactaimagen", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * 2) GUARDAR REGISTRO EN BD (JSON PURO)
 * Backend: POST /addcom_tbl_actaimagenes
 * Body JSON:
 * {
 *   idusuario,
 *   llave,
 *   idimagen: 0,
 *   idacta,
 *   urlimagen,
 *   fechahora: "YYYY-MM-DD HH:mm:ss"
 * }
 */
export const guardarActaImagen = (data) => {
  return axiosClient.post("/addcom_tbl_actaimagenes", data);
};

/**
 * ✅ Wrapper para compatibilidad (si tu ActaQr viejo llamaba "subirImagenActa")
 * Hace el flujo completo:
 * 1) uploadActaImagen()
 * 2) guardarActaImagen()
 */
export const subirImagenActa = async ({
  idusuario,
  llave,
  idacta,
  file,
  fechahora,
}) => {
  // 1) subir archivo físico
  const resUpload = await uploadActaImagen(idacta, file);
  const urlimagen = resUpload?.data?.urlimagen;

  if (!urlimagen) {
    throw new Error("No se recibió urlimagen desde /uploadactaimagen");
  }

  // 2) guardar en BD
  const payloadBD = {
    idusuario,
    llave,
    idimagen: 0,
    idacta,
    urlimagen,
    fechahora:
      fechahora ?? new Date().toISOString().slice(0, 19).replace("T", " "),
  };

  const resBD = await guardarActaImagen(payloadBD);

  // ✅ devolver TODO en un solo objeto por comodidad
  return {
    upload: resUpload.data,
    bd: resBD.data,
    urlimagen,
  };
};