import { http } from "./http";

/**
 * Upload nhiều file (image/video) lên Cloudflare R2
 * @param {File[]} files
 * @returns [{ url, mediaType }]
 */
export async function uploadMedia(files) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const res = await http.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data; // [{ url, mediaType }]
}
