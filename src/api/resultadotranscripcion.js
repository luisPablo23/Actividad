import axiosClient from "./axiosClient";

/**
 * LISTAR resultados de transcripción
 * endpoint: POST /selcom_tbl_resultadotranscripcion
 */
export const getResultadosTranscripcion = async (payload) => {
  const res = await axiosClient.post("/selcom_tbl_resultadotranscripcion", payload);
  return res.data;
};

/**
 * GUARDAR TODO (batch)
 * endpoint: POST /importarresultados
 * (en tu backend: routes.ini -> POST /importarresultados = com_tbl_acta_Ctrl->importarResultados)
 */
export const guardarResultadosTranscripcion = async (payload) => {
  const res = await axiosClient.post("/importarresultados", payload);
  return res.data;
};
