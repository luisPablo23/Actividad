import axios from "axios";


const API_URL = "https://com.technovahosting.com/servicio/";


const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  // const token = localStorage.getItem("token");
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default axiosClient;
