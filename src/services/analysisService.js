/**
 * analysisService.js - Service for analyzing images with Local Backend
 */

// Configuration
const API_URL = "http://localhost:8000/analyze";
const API_URL_MULTI = "http://localhost:8000/analyze-multi";

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
        console.log("Multi-image analysis result:", data);
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
    let inflamed = 0;
    let clogged = 0;
    let scars = 0;

    if (data.predictions) {
        data.predictions.forEach(pred => {
            const label = pred.class.toLowerCase();
            if (label.includes('inflamed') || label.includes('pustule') || label.includes('papule')) inflamed++;
            else if (label.includes('clogged') || label.includes('comedone') || label.includes('whitehead') || label.includes('blackhead')) clogged++;
            else if (label.includes('scar')) scars++;
            else inflamed++; // Default fallback
        });
    }

    const totalSpots = inflamed + clogged + scars;

    // Determine severity
    let severityLevel = 1;
    if (totalSpots > 20) severityLevel = 5;
    else if (totalSpots > 15) severityLevel = 4;
    else if (totalSpots > 10) severityLevel = 3;
    else if (totalSpots > 5) severityLevel = 2;

    const severityLabel = ['ปกติ', 'เล็กน้อย', 'ปานกลาง', 'รุนแรง', 'รุนแรงมาก'][severityLevel - 1];

    return {
        severityLevel,
        severityLabel,
        totalSpots,
        spots: {
            inflamed,
            clogged,
            scars
        },
        imagesProcessed: data.images_processed || 1
    };
};

