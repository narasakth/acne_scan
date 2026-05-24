/**
 * analysisService.js - Service for analyzing images with Local Backend
 */

// Configuration from environment
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/analyze`;
const API_URL_MULTI = `${API_BASE}/analyze-multi`;
const API_DETECT = `${API_BASE}/detect`;
const API_DETECT_MULTI = `${API_BASE}/detect-multi`;

/**
 * Analyze an image using Local Backend (single image)
 * @param {File|Blob} imageFile - The image file to analyze
 * @returns {Promise<Object>} The analysis result
 */
export const analyzeImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append("file", imageFile);

        const [analyzeRes, detectRes] = await Promise.all([
            fetch(API_URL, { method: "POST", body: formData }),
            fetch(API_DETECT, { method: "POST", body: formData })
        ]);

        if (!analyzeRes.ok || !detectRes.ok) {
            throw new Error(`API Error: ${!analyzeRes.ok ? analyzeRes.statusText : detectRes.statusText}`);
        }

        const analyzeData = await analyzeRes.json();
        const detectData = await detectRes.json();
        
        return processResult(analyzeData, detectData);

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

        // Run both classification and detection concurrently
        const [analyzeRes, detectRes] = await Promise.all([
            fetch(API_URL_MULTI, { method: "POST", body: formData }),
            fetch(API_DETECT_MULTI, { method: "POST", body: formData })
        ]);

        if (!analyzeRes.ok || !detectRes.ok) {
            throw new Error(`API Error: ${!analyzeRes.ok ? analyzeRes.statusText : detectRes.statusText}`);
        }

        const analyzeData = await analyzeRes.json();
        const detectData = await detectRes.json();
        
        return processResult(analyzeData, detectData);

    } catch (error) {
        console.error("Multi-Image Analysis Error:", error);
        throw error;
    }
};

/**
 * Process the raw result into our app's format
 */
const processResult = (analyzeData, detectData = null) => {
    // -------------------------------------------------------------
    // 1. Calculate Classification Model Severity & Conf
    // -------------------------------------------------------------
    let classLevel = 1;
    let classConf = 0;

    if (analyzeData.predictions && analyzeData.predictions.length > 0) {
        // Group predictions by source and pick the one with highest confidence
        const bestPredictions = {};
        analyzeData.predictions.forEach(pred => {
            if (!bestPredictions[pred.source] || pred.confidence > bestPredictions[pred.source].confidence) {
                bestPredictions[pred.source] = pred;
            }
        });

        let maxClassLevel = 1;
        let maxClassConf = 0;
        Object.values(bestPredictions).forEach(pred => {
            const label = pred.class.toLowerCase();
            let level = 1;
            if (label === 'moderate') level = 2;
            else if (label === 'severe') level = 3;
            else if (label === 'very severe') level = 4;
            else if (label === 'mild') level = 1;
            
            if (level > maxClassLevel || (level === maxClassLevel && pred.confidence > maxClassConf)) {
                maxClassLevel = level;
                maxClassConf = pred.confidence;
            }
        });
        classLevel = maxClassLevel;
        classConf = maxClassConf;
    }

    // -------------------------------------------------------------
    // 2. Calculate YOLO Detection (Hayashi Criteria) & Conf
    // -------------------------------------------------------------
    let frontCount = 0;
    let leftCount = 0;
    let rightCount = 0;

    const frontConfs = [];
    const leftConfs = [];
    const rightConfs = [];

    const detectionsBySource = { front: [], left: [], right: [] };
    let totalSpots = 0;

    if (detectData && detectData.detections) {
        totalSpots = detectData.count || 0;
        detectData.detections.forEach(det => {
            if (detectionsBySource[det.source]) {
                detectionsBySource[det.source].push(det);
            }
            const conf = det.confidence || 0;
            if (det.source === 'front') {
                frontCount++;
                frontConfs.push(conf);
            } else if (det.source === 'left') {
                leftCount++;
                leftConfs.push(conf);
            } else if (det.source === 'right') {
                rightCount++;
                rightConfs.push(conf);
            }
        });
    }

    // Calculate maximum inflammatory lesions count on half-face
    const frontHalfCount = Math.ceil(frontCount / 2);
    const maxHalfFaceCount = Math.max(leftCount, rightCount, frontHalfCount);

    // Determine Hayashi severity level:
    // Mild (1): 0 - 5
    // Moderate (2): 6 - 20
    // Severe (3): 21 - 50
    // Very Severe (4): > 50
    let detectLevel = 1;
    if (maxHalfFaceCount <= 5) detectLevel = 1;
    else if (maxHalfFaceCount <= 20) detectLevel = 2;
    else if (maxHalfFaceCount <= 50) detectLevel = 3;
    else detectLevel = 4;

    // Determine YOLO detection average confidence score on the worst half-face
    let detectConf = 0.90; // Default baseline if no acne spots detected
    let targetConfs = [];

    if (maxHalfFaceCount > 0) {
        if (maxHalfFaceCount === leftCount && leftCount > 0) {
            targetConfs = leftConfs;
        } else if (maxHalfFaceCount === rightCount && rightCount > 0) {
            targetConfs = rightConfs;
        } else if (maxHalfFaceCount === frontHalfCount && frontConfs.length > 0) {
            targetConfs = frontConfs;
        } else {
            targetConfs = [...frontConfs, ...leftConfs, ...rightConfs];
        }

        if (targetConfs.length > 0) {
            detectConf = targetConfs.reduce((sum, c) => sum + c, 0) / targetConfs.length;
        }
    }

    // -------------------------------------------------------------
    // 3. Ensemble & Fallback Comparison
    // -------------------------------------------------------------
    let severityLevel = detectLevel;
    let decisionSource = 'detection (Hayashi)';

    if (detectLevel === classLevel) {
        severityLevel = detectLevel;
        decisionSource = 'agreement';
    } else {
        // Levels don't match, pick the one with higher confidence
        if (classConf > detectConf) {
            severityLevel = classLevel;
            decisionSource = `classification (conf: ${classConf.toFixed(4)} vs det: ${detectConf.toFixed(4)})`;
        } else {
            severityLevel = detectLevel;
            decisionSource = `detection (conf: ${detectConf.toFixed(4)} vs class: ${classConf.toFixed(4)})`;
        }
    }

    const severityLabel = ['เล็กน้อย', 'ปานกลาง', 'รุนแรง', 'รุนแรงมาก'][severityLevel - 1];

    console.log(`[Severity Ensemble Decision] Final Level: ${severityLevel} (${severityLabel}) via ${decisionSource}`);

    return {
        severityLevel,
        severityLabel,
        totalSpots: totalSpots,
        detections: detectionsBySource,
        spots: {
            inflamed: totalSpots, // Using total spots as inflamed for now as YOLO detects active acne
            clogged: 0,
            scars: 0
        },
        imagesProcessed: analyzeData.images_processed || 1,
        ensembleDetails: {
            detectLevel,
            detectConf,
            classLevel,
            classConf,
            decisionSource
        }
    };
};
