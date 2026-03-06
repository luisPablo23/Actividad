import axiosClient from "./axiosClient";

export const getResultadoOficial = async ({ idusuario, llave, filtros }) => {
  // filtros = { pCampo0, pValor0, ..., pCampo7, pValor7 }
  const payload = {
    idusuario,
    llave,
    pCampo0: "T",
    pValor0: "",
    pCampo1: "T",
    pValor1: "",
    pCampo2: "T",
    pValor2: "",
    pCampo3: "T",
    pValor3: "",
    pCampo4: "T",
    pValor4: "",
    pCampo5: "T",
    pValor5: "",
    pCampo6: "T",
    pValor6: "",
    pCampo7: "T",
    pValor7: "",
    ...(filtros || {}),
  };

  const res = await axiosClient.post("/selcom_tbl_resultadooficial", payload);
  return res.data;
};