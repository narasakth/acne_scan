/**
 * analysisService.js - Service for analyzing images with Local Backend
 */

// Configuration from environment
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/analyze`;
const API_URL_MULTI = `${API_BASE}/analyze-multi`;

/**
 * Analyze an image using Local Backend (single image)
 * @param {File|Blob} imageFile - The image file to analyze
 * @returns {Promise<Object>} The analysis result
 */
export const analyzeImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append("file", imageFile);

        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return processResult(data);

    } catch (error) {
        console.error("Analysis Error:", error);
        throw error;
    }
};

/**
 * Analyze multiple images (front, left, right) using Local Backend
 * @param {File|Blob} frontImage - Front face image (required)
 * @param {File|Blob} leftImage - Left side image (optional)
 * @param {File|Blob} rightImage - Right side image (optional)
 * @returns {Promise<Object>} The combined analysis result
 */
export const analyzeMultipleImages = async (frontImage, leftImage, rightImage) => {
    try {
        const formData = new FormData();
        formData.append("front", frontImage);
        if (leftImage) formData.append("left", leftImage);
        if (rightImage) formData.append("right", rightImage);

        const response = await fetch(API_URL_MULTI, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return processResult(data);

    } catch (error) {
        console.error("Multi-Image Analysis Error:", error);
        throw error;
    }
};

/**
 * Process the raw result into our app's format
 */
const processResult = (data) => {
    let severityLevel = 1;

    if (data.predictions && data.predictions.length > 0) {
        let maxLevel = 1;
        data.predictions.forEach(pred => {
            const label = pred.class.toLowerCase();
            let level = 1;
            if (label === 'moderate') level = 2;
            else if (label === 'severe') level = 3;
            else if (label === 'very severe') level = 4;
            else if (label === 'mild') level = 1;
            
            if (level > maxLevel) {
                maxLevel = level;
            }
        });
        severityLevel = maxLevel;
    }

    const severityLabel = ['เล็กน้อย', 'ปานกลาง', 'รุนแรง', 'รุนแรงมาก'][severityLevel - 1];

    return {
        severityLevel,
        severityLabel,
        totalSpots: 0,
        spots: {
            inflamed: 0,
            clogged: 0,
            scars: 0
        },
        imagesProcessed: data.images_processed || 1
    };
};
