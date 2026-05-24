/**
 * recommendationService.js - Service for fetching treatment recommendations
 * Based on AAD Guidelines of Care for the Management of Acne Vulgaris (2024)
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Fetch treatment recommendations for a specific severity level
 * @param {number} level - Severity level (1-4)
 * @returns {Promise<Object>} Recommendation data
 */
export const getRecommendation = async (level) => {
    try {
        const res = await fetch(`${API_BASE}/recommendations/${level}`);
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return await res.json();
    } catch (error) {
        console.error('Failed to fetch recommendation:', error);
        // Return fallback data if API is unavailable
        return getFallbackRecommendation(level);
    }
};

/**
 * Fallback recommendation data (embedded) for when backend is unavailable
 */
const getFallbackRecommendation = (level) => {
    const data = FALLBACK_DATA[level];
    if (!data) return null;
    return {
        severity: data,
        general_good_practices: [
            { text: "ใช้ยาร่วมกัน (combination therapy) ดีกว่ายาเดี่ยว", icon: "✅" },
            { text: "จำกัดการใช้ยาปฏิชีวนะเพื่อป้องกันเชื้อดื้อยา", icon: "✅" },
            { text: "ใช้ Benzoyl Peroxide ร่วมกับยาปฏิชีวนะเสมอ", icon: "✅" },
            { text: "ฉีด Intralesional corticosteroid สำหรับสิวก้อนใหญ่ที่ปวด", icon: "✅" },
            { text: "ประเมินซ้ำด้วย IGA scale (0-4) เพื่อติดตามผล", icon: "✅" }
        ],
        source: "AAD Guidelines of Care for the Management of Acne Vulgaris (2024), JAAD",
        disclaimer: "ข้อมูลนี้มีจุดประสงค์เพื่อให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถใช้ทดแทนการวินิจฉัยและรักษาจากแพทย์ผิวหนังได้ ควรปรึกษาแพทย์ก่อนเริ่มใช้ยาใดๆ"
    };
};

const FALLBACK_DATA = {
    1: {
        level: 1,
        label_th: "เล็กน้อย",
        description: "สิวอุดตัน (comedones) เล็กน้อย, สิวอักเสบจำนวนน้อย ไม่มีแผลเป็น",
        treatment: {
            topical: [
                { name: "Topical Retinoid", name_th: "ยาทากลุ่ม Retinoid", examples: "adapalene 0.1%, tretinoin", usage: "ทาก่อนนอน วันละ 1 ครั้ง", strength: "strong", icon: "💊" },
                { name: "Benzoyl Peroxide 2.5-5%", name_th: "เบนโซอิลเปอร์ออกไซด์ 2.5-5%", examples: "Benzac AC, Panoxyl", usage: "ทาเช้า วันละ 1 ครั้ง", strength: "strong", icon: "🧴" }
            ],
            oral: [],
            procedural: []
        },
        skincare_routine: {
            morning: [
                { step: 1, action: "ล้างหน้า", detail: "ใช้ผลิตภัณฑ์ล้างหน้าอ่อนโยน" },
                { step: 2, action: "ทายา", detail: "Benzoyl Peroxide 2.5-5%" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "oil-free, non-comedogenic" },
                { step: 4, action: "กันแดด", detail: "SPF 30+" }
            ],
            evening: [
                { step: 1, action: "ล้างหน้า", detail: "ล้างเครื่องสำอาง" },
                { step: 2, action: "ทายา", detail: "Topical Retinoid" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "บำรุงผิว" }
            ]
        },
        precautions: [
            "หลีกเลี่ยงการบีบสิว",
            "Retinoid อาจทำให้ผิวลอก — ทากันแดดทุกวัน",
            "ผลลัพธ์เห็นชัดหลัง 8-12 สัปดาห์"
        ],
        expected_duration: "8-12 สัปดาห์",
        when_to_see_doctor: "หากใช้ยาทาครบ 12 สัปดาห์แล้วไม่ดีขึ้น"
    },
    2: {
        level: 2,
        label_th: "ปานกลาง",
        description: "สิวอักเสบ (papules/pustules) จำนวนปานกลาง อาจมีรอยดำร่วมด้วย",
        treatment: {
            topical: [
                { name: "Topical Retinoid", name_th: "ยาทากลุ่ม Retinoid", usage: "ทาก่อนนอน", strength: "strong", icon: "💊" },
                { name: "Benzoyl Peroxide 2.5-5%", name_th: "BP 2.5-5%", usage: "ทาเช้า", strength: "strong", icon: "🧴" },
                { name: "Topical Antibiotic + BP", name_th: "ยาปฏิชีวนะทา + BP", usage: "ทาวันละ 1-2 ครั้ง", strength: "strong", icon: "💊" }
            ],
            oral: [
                { name: "Oral Doxycycline", name_th: "ยากิน Doxycycline", examples: "50-100 mg", usage: "กินวันละ 1 ครั้ง 3-4 เดือน", strength: "strong", icon: "💊" }
            ],
            procedural: []
        },
        skincare_routine: {
            morning: [
                { step: 1, action: "ล้างหน้า", detail: "gentle cleanser" },
                { step: 2, action: "ทายา", detail: "BP หรือ BP+Clindamycin" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "oil-free" },
                { step: 4, action: "กันแดด", detail: "SPF 30+" }
            ],
            evening: [
                { step: 1, action: "ล้างหน้า", detail: "ล้างเครื่องสำอาง" },
                { step: 2, action: "ทายา", detail: "Retinoid" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "บำรุงผิว" }
            ]
        },
        precautions: [
            "ห้ามใช้ยาปฏิชีวนะเดี่ยว ต้องใช้ร่วม BP",
            "จำกัดยาปฏิชีวนะไม่เกิน 3-4 เดือน",
            "Doxycycline ไวต่อแสงแดด"
        ],
        expected_duration: "8-12 สัปดาห์, ยาปฏิชีวนะ 3-4 เดือน",
        when_to_see_doctor: "หากสิวไม่ดีขึ้นหลัง 3-4 เดือน"
    },
    3: {
        level: 3,
        label_th: "รุนแรง",
        description: "สิวอักเสบจำนวนมาก มี nodules เริ่มเกิดแผลเป็น",
        treatment: {
            topical: [
                { name: "Topical Retinoid", name_th: "ยาทากลุ่ม Retinoid", usage: "ทาก่อนนอน", strength: "strong", icon: "💊" },
                { name: "Benzoyl Peroxide 5-10%", name_th: "BP 5-10%", usage: "ทาเช้า", strength: "strong", icon: "🧴" }
            ],
            oral: [
                { name: "Oral Doxycycline", name_th: "ยากิน Doxycycline", examples: "100 mg", usage: "กินวันละ 1-2 ครั้ง", strength: "strong", icon: "💊" },
                { name: "Oral Isotretinoin", name_th: "ยากิน Isotretinoin", examples: "0.5-1 mg/kg", usage: "กินทุกวัน", strength: "strong", note: "แนะนำอย่างยิ่งหากไม่ตอบสนอง", icon: "⚠️" }
            ],
            procedural: [
                { name: "Intralesional Corticosteroid", name_th: "ฉีดคอร์ติโคสเตียรอยด์", usage: "สำหรับ nodule ที่ปวดมาก", strength: "good_practice", icon: "💉" }
            ]
        },
        skincare_routine: {
            morning: [
                { step: 1, action: "ล้างหน้า", detail: "อ่อนโยนมาก" },
                { step: 2, action: "ทายา", detail: "BP (ถ้าไม่ใช้ isotretinoin)" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "เข้มข้น" },
                { step: 4, action: "กันแดด", detail: "SPF 50+" }
            ],
            evening: [
                { step: 1, action: "ล้างหน้า", detail: "อ่อนโยน" },
                { step: 2, action: "ทายา", detail: "ตามแพทย์สั่ง" },
                { step: 3, action: "มอยเจอร์ไรเซอร์", detail: "เข้มข้น + ลิปบาล์ม" }
            ]
        },
        precautions: [
            "⚠️ Isotretinoin: ห้ามตั้งครรภ์",
            "ผิวแห้งมาก ต้องใช้มอยเจอร์ไรเซอร์",
            "ต้องตรวจเลือดตามแพทย์แนะนำ"
        ],
        expected_duration: "Isotretinoin 4-6 เดือน",
        when_to_see_doctor: "ควรพบแพทย์ผิวหนังทันที"
    },
    4: {
        level: 4,
        label_th: "รุนแรงมาก",
        description: "สิวถุง (cystic) ทั่วใบหน้า แผลเป็นเกิดขึ้นเร็ว",
        treatment: {
            topical: [
                { name: "Gentle Cleanser + Heavy Moisturizer", name_th: "ล้างหน้าอ่อนโยน + มอยเจอร์ไรเซอร์เข้มข้น", usage: "เช้าและเย็น", strength: "good_practice", icon: "🧴" }
            ],
            oral: [
                { name: "Oral Isotretinoin", name_th: "ยากิน Isotretinoin", examples: "0.5-1 mg/kg/วัน", usage: "กินทุกวัน 4-6 เดือน", strength: "strong", note: "First-line", icon: "⚠️" }
            ],
            procedural: [
                { name: "Intralesional Corticosteroid", name_th: "ฉีดคอร์ติโคสเตียรอยด์", usage: "สำหรับ cyst ที่ปวดมาก", strength: "good_practice", icon: "💉" }
            ]
        },
        skincare_routine: {
            morning: [
                { step: 1, action: "ล้างหน้า", detail: "อ่อนโยนมาก ไม่มี active" },
                { step: 2, action: "มอยเจอร์ไรเซอร์", detail: "เข้มข้น (ceramide)" },
                { step: 3, action: "กันแดด", detail: "SPF 50+" }
            ],
            evening: [
                { step: 1, action: "ล้างหน้า", detail: "อ่อนโยนมาก" },
                { step: 2, action: "มอยเจอร์ไรเซอร์", detail: "เข้มข้น + ลิปบาล์ม" }
            ]
        },
        precautions: [
            "🚨 ห้ามตั้งครรภ์อย่างเด็ดขาด",
            "🚨 ห้ามบริจาคเลือดระหว่างใช้ยา",
            "⚠️ ห้ามทำ laser ระหว่างใช้ยา",
            "⚠️ ติดตามอาการทางจิตใจ"
        ],
        expected_duration: "Isotretinoin 4-6 เดือน",
        when_to_see_doctor: "ต้องพบแพทย์ผิวหนังทันที"
    }
};
