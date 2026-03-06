import React, { useEffect, useState } from "react";
import { getActas } from "../api/acta";
import { getSession } from "../utils/flowStorage";

const ActaList = () => {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarActas = async () => {
    setLoading(true);

    const { idusuario, llave } = getSession(); // ✅ desde localStorage

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
    };

    const res = await getActas(payload);

    if (res?.info?.item) {
      setActas(res.info.item);
    } else {
      setActas([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarActas();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center mt-10">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );

  return (
    <div className="p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary">📋 Listado de Actas</h2>

          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Mesa</th>
                  <th>Elección</th>
                  <th>Estado</th>
                  <th>Número Acta</th>
                </tr>
              </thead>
              <tbody>
                {actas.length > 0 ? (
                  actas.map((a) => (
                    <tr key={a.idacta}>
                      <td>{a.idacta}</td>
                      <td>{a.idmesa}</td>
                      <td>{a.ideleccion}</td>
                      <td>
                        <span className="badge badge-success">
                          {a.idestadoacta}
                        </span>
                      </td>
                      <td className="font-bold">{a.numeroacta}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500">
                      No hay actas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActaList;