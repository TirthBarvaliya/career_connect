export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];
export const PDF_MIME_TYPES = ["application/pdf"];

const toLabel = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

export const validateFileByTypeAndSize = ({
  file,
  allowedMimeTypes,
  maxBytes = MAX_UPLOAD_BYTES,
  fileLabel = "File"
}) => {
  if (!file) {
    throw new Error(`${fileLabel} is required.`);
  }
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`${fileLabel} format is not supported.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`${fileLabel} must be ${toLabel(maxBytes)} or smaller.`);
  }
};

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to process generated PDF."));
    reader.readAsDataURL(blob);
  });

