import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

export default function QrScanner({ onResult }) {
  const onResultRef = useRef(onResult);

  // ✅ Mantiene el ref actualizado sin reiniciar el scanner
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250, facingMode: "environment" },
      false
    );

    scanner.render(
      (decodedText) => {
        onResultRef.current(decodedText); // ✅ siempre llama a la versión actual
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []); // ✅ array vacío correcto: el scanner solo se inicia una vez

  return <div id="qr-reader" />;
}