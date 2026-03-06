import axiosClient from "./axiosClient";

/**
 * GUARDAR observación
 * POST /addcom_tbl_observaciones
 * Body: { idusuario, llave, idacta, observacion }
 */
export const guardarObservacion = (data) => {
  return axiosClient.post("/addcom_tbl_observaciones", data);
};

/**
 * LISTAR observaciones por acta
 * POST /selcom_tbl_observaciones
 */
export const getObservaciones = (payload) => {
  return axiosClient.post("/selcom_tbl_observaciones", payload);
};