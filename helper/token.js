const crypto = require('crypto');

// --- KONFIGURASI ---
const TIME_STEP = 120; // 1 Menit (dalam detik)

/**
 * Fungsi untuk menghasilkan Token 4 Digit
 * @param {string} userId - ID Pengguna
 * @param {string} secretKey - Kunci Rahasia
 * @returns {string} Token 4 digit (string)
 */
function generateToken(userId, secretKey) {
    const currentEpoch = Math.floor(Date.now() / 1000);
    const timeInterval = Math.floor(currentEpoch / TIME_STEP);
    const payload = `${userId}-${timeInterval}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const hexDigest = hmac.digest('hex');
    const hashInt = parseInt(hexDigest.substring(0, 8), 16);
    const tokenInt = hashInt % 100000;
    return tokenInt.toString().padStart(5, '0');
}

/**
 * Fungsi untuk Memverifikasi Token
 * @param {string} inputToken - Token yang dimasukkan user
 * @param {string} userId - ID Pengguna
 * @param {string} secretKey - Kunci Rahasia
 * @returns {boolean} True jika valid, False jika tidak
 */
function verifyToken(inputToken, userId, secretKey) {
    // Generate token yang SEHARUSNYA ada saat ini
    const currentValidToken = generateToken(userId, secretKey);

    // Bandingkan token input dengan token yang valid
    // Catatan: Dalam produksi, gunakan timingSafeEqual untuk keamanan maksimal
    return inputToken === currentValidToken;
}

// --- CONTOH PENGGUNAAN ---
/**
const myUserId = "0895321701798";
const mySecret = "rahasiaBangetDeh";

// 1. Generate Token
console.log("=== GENERATOR TOKEN ===");
const token = generateToken(myUserId, mySecret);
console.log(`Waktu   : ${new Date().toLocaleTimeString()}`);
console.log(`User ID : ${myUserId}`);
console.log(`Token   : ${token}`);
console.log(`(Token ini valid selama 1 menit)`);

console.log("\n=== SIMULASI VERIFIKASI ===");

// Skenario A: User memasukkan token yang benar
const isSuccess = verifyToken(token, myUserId, mySecret);
console.log(`Input "${token}" -> Hasil: ${isSuccess ? "✅ VALID" : "❌ GAGAL"}`);

// Skenario B: User memasukkan token salah / ngawur
const wrongToken = "74696";
const isFail = verifyToken(wrongToken, myUserId, mySecret);
console.log(`Input "${wrongToken}" -> Hasil: ${isFail ? "✅ VALID" : "❌ GAGAL"}`);
 */

module.exports = { generateToken, verifyToken };