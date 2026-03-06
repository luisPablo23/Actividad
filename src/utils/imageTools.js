import exifr from "exifr";

async function getExifOrientation(file) {
  try {
    const o = await exifr.orientation(file);
    return Number(o) || 1;
  } catch {
    return 1;
  }
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

function applyOrientation(ctx, orientation, w, h) {
  switch (orientation) {
    case 3:
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -h);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-w, 0);
      break;
    default:
      break;
  }
}

export async function fixRotateAndCompressImage(
  file,
  { maxWidth = 1600, quality = 0.7 } = {}
) {
  const orientation = await getExifOrientation(file);
  const img = await fileToImage(file);

  let w = img.naturalWidth;
  let h = img.naturalHeight;

  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w);
    w = maxWidth;
  }

  const rotate90 = [6, 8].includes(orientation);
  const canvas = document.createElement("canvas");
  canvas.width = rotate90 ? h : w;
  canvas.height = rotate90 ? w : h;

  const ctx = canvas.getContext("2d");
  applyOrientation(ctx, orientation, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((res) =>
    canvas.toBlob(res, "image/jpeg", quality)
  );

  // ✅ Guarda: toBlob puede devolver null en contextos restringidos
  if (!blob) throw new Error("No se pudo comprimir la imagen (toBlob devolvió null)");

  return new File([blob], "acta.jpg", { type: "image/jpeg" });
}