import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

// ── Security constants ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

/** Hard cap: 2 MB */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

/** Minimum magic-byte header length needed for detection */
const MIN_HEADER_LENGTH = 12;

/**
 * Detects the real MIME type from the file's magic bytes.
 * This prevents MIME-type spoofing attacks where the client sends
 * a malicious file disguised with a valid Content-Type header.
 */
function detectMimeFromMagicBytes(buffer: Buffer): AllowedMime | null {
  if (buffer.length < MIN_HEADER_LENGTH) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Enterprise-grade file validation pipe for avatar uploads.
 *
 * Defence-in-depth layers:
 *  1. Presence check — rejects empty uploads
 *  2. MIME header check — validates Content-Type from multipart header
 *  3. Magic-byte check — detects actual file type from binary signature
 *  4. Size cap — enforces 2 MB hard limit
 */
@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    // Layer 1: Presence
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Layer 2: MIME header
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as AllowedMime)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Layer 3: Magic-byte verification (anti-spoofing)
    const detectedMime = detectMimeFromMagicBytes(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        'File signature unrecognised. Only JPEG, PNG, and WebP images are accepted.',
      );
    }
    if (detectedMime !== file.mimetype) {
      throw new BadRequestException(
        'File signature does not match declared content type. Upload rejected.',
      );
    }

    // Layer 4: Size cap
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed: 2MB`,
      );
    }

    return file;
  }
}
