import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../components/Login";
import PrivateRoute from "./PrivateRoute";
import MobileLayout from "../components/MobileLayout";

import ActaQr from "../pages/ActaQr";
import ActaFoto from "../pages/ActaFoto";
import ResultadoTranscripcionList from "../pages/ResultadoTranscripcionList";
import Panel from "../pages/Panel";
import ResultadoOficial from "../pages/ResultadoOficial";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/acta/qr"
          element={
            <PrivateRoute>
              <MobileLayout>
                <ActaQr />
              </MobileLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/acta/foto"
          element={
            <PrivateRoute>
              <MobileLayout>
                <ActaFoto />
              </MobileLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/acta/transcripcion"
          element={
            <PrivateRoute>
              <MobileLayout>
                <ResultadoTranscripcionList />
              </MobileLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/panel"
          element={
            <PrivateRoute>
              <MobileLayout>
                <Panel />
              </MobileLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/resultados/oficial"
          element={
            <PrivateRoute>
              <MobileLayout>
                <ResultadoOficial />
              </MobileLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;