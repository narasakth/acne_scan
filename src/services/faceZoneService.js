/**
 * faceZoneService.js - MediaPipe Face Mesh zone segmentation
 * 
 * Splits a face image into 5 zones: forehead, left cheek, right cheek, nose, chin.
 * Uses MediaPipe Face Mesh loaded from CDN (global window.FaceMesh).
 */

/* ============================================================
 * Constants & Zone Definitions
 * ============================================================ */

// How far inward the cheek zone extends toward the nose (0–1 ratio of half-face width)
const CHEEK_INNER_OFFSET = 0.35;

// Vertical padding for zone bounding boxes
const TOP_PAD = 0.02;
const BOTTOM_PAD = 0.04;

// Face oval landmark indices used for clipping crops to the face contour
const FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 377, 152, 148, 176, 149, 150, 136, 172,
    58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

/**
 * Zone configuration — key, Thai label, overlay color, stroke color
 */
export const ZONES = [
    { key: 'forehead',   label: 'หน้าผาก',  color: 'rgba(255, 107, 107, 0.30)', stroke: '#ff6b6b' },
    { key: 'leftCheek',  label: 'แก้มซ้าย',  color: 'rgba(69, 183, 209, 0.30)',  stroke: '#45b7d1' },
    { key: 'rightCheek', label: 'แก้มขวา',  color: 'rgba(150, 206, 180, 0.30)', stroke: '#96ceb4' },
    { key: 'nose',       label: 'จมูก',      color: 'rgba(78, 205, 196, 0.30)',  stroke: '#4ecdc4' },
    { key: 'chin',       label: 'คาง',       color: 'rgba(254, 202, 87, 0.30)',  stroke: '#feca57' },
];

/* ============================================================
 * Singleton FaceMesh instance
 * ============================================================ */

let faceMeshInstance = null;
let faceMeshReady = false;
let initPromise = null;

/**
 * Initialize MediaPipe FaceMesh (singleton).
 * Resolves when the model is loaded and ready.
 */
export const initFaceMesh = () => {
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve, reject) => {
        try {
            const FaceMesh = window.FaceMesh;
            if (!FaceMesh) {
                reject(new Error('MediaPipe FaceMesh not loaded. Check CDN script in index.html.'));
                return;
            }

            faceMeshInstance = new FaceMesh({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMeshInstance.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            // We resolve the promise inside onResults the first time
            // to ensure the model is fully warmed up.
            let resolved = false;

            faceMeshInstance.onResults(() => {
                if (!resolved) {
                    resolved = true;
                    faceMeshReady = true;
                    resolve();
                }
            });

            // Send a tiny blank canvas to trigger initialization
            const warmup = document.createElement('canvas');
            warmup.width = 64;
            warmup.height = 64;
            warmup.getContext('2d'); // ensure context exists
            faceMeshInstance.send({ image: warmup });
        } catch (err) {
            reject(err);
        }
    });

    return initPromise;
};

/* ============================================================
 * Zone Bounds Calculation
 * ============================================================ */

/**
 * Compute the bounding box (in pixels) for a given zone.
 * @param {Array} lm - Array of normalized {x, y, z} landmarks
 * @param {number} W  - Image width
 * @param {number} H  - Image height
 * @param {string} zoneKey - One of: forehead, leftCheek, rightCheek, nose, chin
 * @returns {{ x: number, y: number, w: number, h: number }}
 */
export const getZoneBounds = (lm, W, H, zoneKey) => {
    const noseX = lm[1].x;
    const topY = lm[10].y;
    const leftX = lm[234].x;
    const rightX = lm[454].x;
    const mouthY = Math.max(lm[0]?.y ?? 0.60, lm[17]?.y ?? 0.60);
    const chinY = lm[152].y;

    // Brow line (top of eyebrows — closest to forehead)
    const browY = Math.min(
        lm[105]?.y ?? 0.30, lm[66]?.y ?? 0.30, lm[107]?.y ?? 0.30,
        lm[334]?.y ?? 0.30, lm[296]?.y ?? 0.30, lm[336]?.y ?? 0.30
    );

    // Under-eye line (bottom of eyes)
    const leftEyeBottom = Math.max(
        lm[145]?.y ?? browY, lm[153]?.y ?? browY,
        lm[154]?.y ?? browY, lm[155]?.y ?? browY
    );
    const rightEyeBottom = Math.max(
        lm[374]?.y ?? browY, lm[381]?.y ?? browY,
        lm[382]?.y ?? browY, lm[383]?.y ?? browY
    );
    const underEyeY = Math.max(leftEyeBottom, rightEyeBottom);

    let x, y, w, h;

    switch (zoneKey) {
        case 'forehead':
            x = leftX - 0.01;
            y = topY - 0.01;
            w = (rightX - leftX) + 0.02;
            h = (browY - topY) + 0.04;
            break;

        case 'leftCheek': {
            const halfFace = noseX - leftX;
            const innerX = noseX - halfFace * CHEEK_INNER_OFFSET;
            x = leftX - 0.01;
            y = underEyeY - TOP_PAD;
            w = innerX - x;
            h = (mouthY + BOTTOM_PAD) - y;
            break;
        }

        case 'rightCheek': {
            const halfFace = rightX - noseX;
            const innerX = noseX + halfFace * CHEEK_INNER_OFFSET;
            x = innerX;
            y = underEyeY - TOP_PAD;
            w = rightX - x + 0.01;
            h = (mouthY + BOTTOM_PAD) - y;
            break;
        }

        case 'nose': {
            const noseLeftW = (noseX - leftX) * 0.35;
            const noseRightW = (rightX - noseX) * 0.35;
            x = noseX - noseLeftW;
            y = browY - TOP_PAD;
            w = noseLeftW + noseRightW;
            h = (mouthY + BOTTOM_PAD) - y;
            break;
        }

        case 'chin': {
            const chinLeft = (noseX - leftX) * 0.12;
            const chinRight = (rightX - noseX) * 0.12;
            x = leftX + chinLeft;
            y = mouthY - TOP_PAD;
            w = rightX - leftX - chinLeft - chinRight;
            h = (chinY + 0.02) - y;
            break;
        }

        default:
            x = 0; y = 0; w = 1; h = 1;
    }

    // Clamp to [0, 1]
    x = Math.max(0, x);
    y = Math.max(0, y);
    w = Math.min(1 - x, w);
    h = Math.min(1 - y, h);

    return {
        x: Math.round(x * W),
        y: Math.round(y * H),
        w: Math.round(w * W),
        h: Math.round(h * H),
    };
};

/* ============================================================
 * Crop + Clip to Face Oval
 * ============================================================ */

/**
 * Crop a single zone from an image, clipped to the FACE_OVAL contour.
 * @param {HTMLImageElement} image
 * @param {Array} lm - landmarks
 * @param {number} W
 * @param {number} H
 * @param {string} zoneKey
 * @returns {{ canvas: HTMLCanvasElement, bounds: Object }}
 */
const cropZone = (image, lm, W, H, zoneKey) => {
    const b = getZoneBounds(lm, W, H, zoneKey);

    const canvas = document.createElement('canvas');
    canvas.width = b.w;
    canvas.height = b.h;
    const ctx = canvas.getContext('2d');

    // Clip to face oval contour
    ctx.beginPath();
    FACE_OVAL.forEach((idx, i) => {
        const px = lm[idx].x * W - b.x;
        const py = lm[idx].y * H - b.y;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(image, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);

    return { canvas, bounds: b };
};

/* ============================================================
 * Draw Overlay
 * ============================================================ */

/**
 * Draw zone rectangles + face oval on an overlay canvas.
 * @param {HTMLCanvasElement} overlayCanvas
 * @param {Array} lm - landmarks
 * @param {number} W  - original image width
 * @param {number} H  - original image height
 * @param {number} displayW - canvas display width
 * @param {number} displayH - canvas display height
 */
export const drawOverlay = (overlayCanvas, lm, W, H, displayW, displayH) => {
    overlayCanvas.width = displayW;
    overlayCanvas.height = displayH;
    const sx = displayW / W;
    const sy = displayH / H;
    const ctx = overlayCanvas.getContext('2d');

    ctx.clearRect(0, 0, displayW, displayH);

    // Draw zone rectangles
    ZONES.forEach(z => {
        const b = getZoneBounds(lm, W, H, z.key);
        ctx.fillStyle = z.color;
        ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
        ctx.strokeStyle = z.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    });

    // Draw face oval (dashed)
    ctx.beginPath();
    FACE_OVAL.forEach((idx, i) => {
        const x = lm[idx].x * displayW;
        const y = lm[idx].y * displayH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
};

/* ============================================================
 * Main Processing Function
 * ============================================================ */

/**
 * Process a single image: detect landmarks → crop all 5 zones → draw overlay data.
 *
 * @param {HTMLImageElement} imageElement - The source image
 * @returns {Promise<{ zones: Array, landmarks: Array, width: number, height: number }>}
 */
export const processImageZones = (imageElement) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Make sure FaceMesh is initialized
            if (!faceMeshReady) {
                await initFaceMesh();
            }

            const W = imageElement.naturalWidth;
            const H = imageElement.naturalHeight;

            // Create a canvas from the image for FaceMesh input
            const inputCanvas = document.createElement('canvas');
            inputCanvas.width = W;
            inputCanvas.height = H;
            inputCanvas.getContext('2d').drawImage(imageElement, 0, 0);

            // Set up one-time result handler
            faceMeshInstance.onResults((results) => {
                if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                    reject(new Error('ไม่พบใบหน้าในภาพ'));
                    return;
                }

                const lm = results.multiFaceLandmarks[0];

                // Crop all zones
                const zones = ZONES.map(z => {
                    const result = cropZone(imageElement, lm, W, H, z.key);
                    return {
                        key: z.key,
                        label: z.label,
                        color: z.stroke,
                        dataUrl: result.canvas.toDataURL('image/png'),
                        width: result.bounds.w,
                        height: result.bounds.h,
                    };
                });

                resolve({
                    zones,
                    landmarks: lm,
                    width: W,
                    height: H,
                });
            });

            // Send the image
            faceMeshInstance.send({ image: inputCanvas });
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Process all 3 face images (front, left, right).
 * Returns zone data for each angle.
 *
 * @param {{ front: string, left: string, right: string }} imageUrls
 *        Object with data URLs or blob URLs for each angle
 * @returns {Promise<Object>} { front: {...}, left: {...}, right: {...} }
 */
export const processAllAngles = async (imageUrls) => {
    const results = {};
    const angles = ['front', 'left', 'right'];

    for (const angle of angles) {
        if (!imageUrls[angle]) continue;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrls[angle];
        });

        try {
            results[angle] = await processImageZones(img);
        } catch (err) {
            console.warn(`Zone processing failed for ${angle}:`, err.message);
            results[angle] = null;
        }
    }

    return results;
};
