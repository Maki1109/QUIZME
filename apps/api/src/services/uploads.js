/**
 * Image uploads (avatars, flashcard images) → Cloudinary.
 *
 * Files are held in memory, size-limited, and identified by their actual bytes — the client-supplied
 * filename and MIME type are never trusted. SVG and other scriptable formats are not accepted.
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const env = require('../core/env');
const { badRequest, unavailable } = require('../core/errors');

const MAX_BYTES = 3 * 1024 * 1024;

const receive = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 5 } }).single('image');

/** Detect the image type from magic bytes. Returns 'png' | 'jpg' | 'gif' | 'webp' | null. */
function sniffImage(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

let configured = false;
function client() {
  if (!env.cloudinary.enabled) throw unavailable('Chức năng tải ảnh chưa được cấu hình');
  if (!configured) {
    cloudinary.config({ cloud_name: env.cloudinary.cloudName, api_key: env.cloudinary.apiKey, api_secret: env.cloudinary.apiSecret, secure: true });
    configured = true;
  }
  return cloudinary;
}

/** Upload a validated image buffer. `kind` is 'avatar' or 'card'. Returns the https URL. */
function uploadImage(buffer, userId, kind) {
  const format = sniffImage(buffer);
  if (!format) throw badRequest('Chỉ chấp nhận ảnh PNG, JPG, GIF hoặc WEBP');
  const size = kind === 'avatar' ? 400 : 1200;
  return new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        folder: `quizme/users/${userId}/${kind}`,
        resource_type: 'image',
        // Re-encoding strips metadata and anything that is not pixel data.
        transformation: [{ width: size, height: size, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result || !result.secure_url) return reject(unavailable('Không tải được ảnh lên, vui lòng thử lại'));
        return resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

/** True for image URLs that live in our own Cloudinary account. */
function isOwnImageUrl(url) {
  return typeof url === 'string' && Boolean(env.cloudinary.cloudName) && url.startsWith(`https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/`) && url.length <= 500;
}

module.exports = { receive, sniffImage, uploadImage, isOwnImageUrl, MAX_BYTES };
