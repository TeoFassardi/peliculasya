import { z } from "zod";

const MAX_IMAGE_BYTES = 250 * 1024;
const MAX_POSTER_LENGTH = 350_000;
const localPoster = /^\/posters\/[a-z0-9-]+\.jpg$/;
const jpegData = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

function isValidPoster(value: string): boolean {
  if (value === "" || localPoster.test(value)) return true;
  if (value.startsWith("https://") && value.length <= 2048) {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }
  if (value.length > MAX_POSTER_LENGTH || !jpegData.test(value)) return false;
  const encoded = value.slice("data:image/jpeg;base64,".length);
  if (encoded.length % 4 !== 0) return false;
  const bytes = Buffer.from(encoded, "base64");
  return (
    bytes.length <= MAX_IMAGE_BYTES &&
    bytes.length >= 5 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  );
}

export const posterUrlSchema = z
  .string()
  .max(MAX_POSTER_LENGTH, "La imagen es demasiado grande")
  .refine(
    isValidPoster,
    "Usá una URL HTTPS válida o subí una imagen desde el formulario",
  );
