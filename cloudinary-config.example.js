// Copy this file to cloudinary-config.js and fill in your Cloudinary
// cloud name and an UNSIGNED upload preset (created in the Cloudinary
// console: Settings -> Upload -> Upload presets -> Add upload preset,
// set "Signing Mode" to "Unsigned").
//
// Note: these values are not secret in the sense of an API key/secret —
// they're meant to be used client-side. Just know that anyone who reads
// this file's contents can upload files through this preset, consuming
// your Cloudinary quota. Fine for a small private team site; keep the
// preset scoped to reasonable file size/type limits in the Cloudinary
// console if you want extra safety.
export const cloudinaryConfig = {
  cloudName: "YOUR_CLOUD_NAME",
  uploadPreset: "YOUR_UNSIGNED_UPLOAD_PRESET"
};
