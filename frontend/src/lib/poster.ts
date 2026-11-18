export const MAX_POSTER_BYTES = 250 * 1024;
const MAX_POSTER_LENGTH = 350_000;

export function isValidPoster(value: string): boolean {
  if (!value || /^\/posters\/[a-z0-9-]+\.jpg$/.test(value)) return true;
  if (value.startsWith("https://") && value.length <= 2048) {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }
  if (
    value.length > MAX_POSTER_LENGTH ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    return false;
  const encoded = value.slice("data:image/jpeg;base64,".length);
  if (encoded.length % 4 !== 0) return false;
  try {
    const bytes = atob(encoded);
    return (
      bytes.length <= MAX_POSTER_BYTES &&
      bytes.length >= 5 &&
      bytes.charCodeAt(0) === 0xff &&
      bytes.charCodeAt(1) === 0xd8 &&
      bytes.charCodeAt(2) === 0xff &&
      bytes.charCodeAt(bytes.length - 2) === 0xff &&
      bytes.charCodeAt(bytes.length - 1) === 0xd9
    );
  } catch {
    return false;
  }
}

export async function preparePoster(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Elegí una imagen JPG, PNG o WebP.");
  }
  if (file.size > 8 * 1024 * 1024) throw new Error("La imagen original debe pesar hasta 8 MB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    ) {
      throw new Error("Elegí una imagen de hasta 40 megapíxeles.");
    }
    const scale = Math.min(1, 800 / image.naturalWidth, 1200 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No pudimos preparar la imagen en este navegador.");
    for (let attempt = 0; attempt < 4; attempt++) {
      const reduction = scale * 0.8 ** attempt;
      canvas.width = Math.max(1, Math.round(image.naturalWidth * reduction));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * reduction));
      context.fillStyle = "#1b1e21";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg", 0.82);
      if (isValidPoster(result)) return result;
    }
    throw new Error("No pudimos reducir la imagen. Probá con una más pequeña.");
  } catch (error) {
    if (error instanceof Error && error.name !== "EncodingError") throw error;
    throw new Error("El archivo no se pudo abrir como imagen. Probá con otro JPG, PNG o WebP.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
