import axiosClient from "./axiosClient";

export const getActas = async (payload) => {
  const res = await axiosClient.post("/selcom_tbl_acta", payload);
  return res.data;
};
export const createActa = async (payload) => {
  const res = await axiosClient.post("/acta", payload);
  return res.data;
};

export const getActaByNumero = async (numeroActa) => {
  const res = await axiosClient.get(`/acta/buscar/${numeroActa}`);
  return res.data;
};