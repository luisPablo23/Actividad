// src/api/auth.js
import axiosClient from "./axiosClient";

export const login = async (email, password) => {
  try {
    const res = await axiosClient.post("validauser", {
      
      nombreusuario: email,
      clave: password,
    });
    return res.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Error al conectar con la API",
      status: error.response?.status,
      raw: error.response?.data,
    };
  }
};
