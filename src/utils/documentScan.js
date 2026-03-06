// src/utils/documentScan.js

function waitForOpenCV(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (window.cv && window.cv.Mat) return resolve(true);

    const start = Date.now();
    const t = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        reject(new Error("OpenCV no cargó a tiempo."));
      }
    }, 50);
  });
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function imageToCanvas(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function orderPoints(pts) {
  // pts: [{x,y} x4] => [topLeft, topRight, bottomRight, bottomLeft]
  const sum = pts.map((p) => p.x + p.y);
  const diff = pts.map((p) => p.x - p.y);

  const tl = pts[sum.indexOf(Math.min(...sum))];
  const br = pts[sum.indexOf(Math.max(...sum))];
  const tr = pts[diff.indexOf(Math.max(...diff))];
  const bl = pts[diff.indexOf(Math.min(...diff))];

  return [tl, tr, br, bl];
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

async function canvasToJpegFile(canvas, quality = 0.85, filename = "acta-crop.jpg") {
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("toBlob devolvió null");
  return new File([blob], filename, { type: "image/jpeg" });
}

/**
 * Detecta el rectángulo más grande (contorno de 4 puntos) y hace perspectiva (warp).
 * Devuelve File (JPEG) o null si no pudo detectar bien.
 */
export async function autoCropActa(file, opts = {}) {
  const {
    minAreaRatio = 0.10, // % mínimo del área total para aceptar como "acta"
    canny1 = 50,
    canny2 = 150,
    blurSize = 5,
    jpegQuality = 0.9,
    timeoutMs = 8000,
  } = opts;

  await waitForOpenCV(timeoutMs);

  const img = await fileToImage(file);
  const srcCanvas = imageToCanvas(img);

  const cv = window.cv;

  const src = cv.imread(srcCanvas);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(blurSize, blurSize), 0);

  const edges = new cv.Mat();
  cv.Canny(blur, edges, canny1, canny2);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let bestApprox = null;
  let bestArea = 0;

  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const peri = cv.arcLength(cnt, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

    if (approx.rows === 4) {
      const area = cv.contourArea(approx);
      if (area > bestArea) {
        if (bestApprox) bestApprox.delete();
        bestApprox = approx;
        bestArea = area;
      } else {
        approx.delete();
      }
    } else {
      approx.delete();
    }
    cnt.delete();
  }

  const totalArea = src.cols * src.rows;
  const ok = bestApprox && bestArea >= totalArea * minAreaRatio;

  if (!ok) {
    // cleanup
    src.delete(); gray.delete(); blur.delete(); edges.delete();
    contours.delete(); hierarchy.delete();
    if (bestApprox) bestApprox.delete();
    return null;
  }

  // sacar puntos
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const x = bestApprox.intPtr(i, 0)[0];
    const y = bestApprox.intPtr(i, 0)[1];
    pts.push({ x, y });
  }

  const [tl, tr, br, bl] = orderPoints(pts);

  const widthA = dist(br, bl);
  const widthB = dist(tr, tl);
  const maxW = Math.round(Math.max(widthA, widthB));

  const heightA = dist(tr, br);
  const heightB = dist(tl, bl);
  const maxH = Math.round(Math.max(heightA, heightB));

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y,
    tr.x, tr.y,
    br.x, br.y,
    bl.x, bl.y,
  ]);

  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxW - 1, 0,
    maxW - 1, maxH - 1,
    0, maxH - 1,
  ]);

  const M = cv.getPerspectiveTransform(srcTri, dstTri);

  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(maxW, maxH), cv.INTER_LINEAR, cv.BORDER_REPLICATE);

  // dst -> canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = dst.cols;
  outCanvas.height = dst.rows;

  // OpenCV guarda en RGBA cuando viene de imread(canvas) así que lo pintamos con imshow
  cv.imshow(outCanvas, dst);

  // cleanup
  src.delete(); gray.delete(); blur.delete(); edges.delete();
  contours.delete(); hierarchy.delete();
  bestApprox.delete();
  srcTri.delete(); dstTri.delete(); M.delete(); dst.delete();

  return await canvasToJpegFile(outCanvas, jpegQuality, "acta-crop.jpg");
}