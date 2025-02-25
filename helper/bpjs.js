const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
require('dotenv').config();
let { BPJSHOST, SIMRSHOST } = process.env;


const findBPJS = async (noKartu, type) => {

    let tanggal = new Date().toISOString().slice(0, 10);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BPJSHOST}/api/bpjs/peserta/${type}?nik=${noKartu}&tglSEP=${tanggal}`,
        headers: {}
    };
    return await axios.request(config)

}
const cekRujukan = async (noKartu) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BPJSHOST}/api/bpjs/peserta/rujukan?noKartu=${noKartu}`,
        headers: {}
    };
    return await axios.request(config)
}
const cekPoli = async () => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${SIMRSHOST}/api/ralan/poli`,
        headers: { Authorization: process.env.SECRET_WA, "Content-Type": "application/json" }
    };
    return await axios.request(config)
}

function cekSttRujukan(tglKunjungan) {
    const visitDate = new Date(tglKunjungan);
    const currentDate = new Date();

    // Hitung selisih bulan
    const diffInMonths = (currentDate.getFullYear() - visitDate.getFullYear()) * 12 +
        (currentDate.getMonth() - visitDate.getMonth());

    return diffInMonths > 3;
}
async function sendWA(telp, pesan) {
    try {
        await axios.post(process.env.HOSTWA, { telp: telp, message: pesan }, {
            headers: {
                Authorization: process.env.SECRET_WA,
                "Content-Type": "application/json",
                timeout: 2000 // only wait for 2s
            }
        });
    } catch (error) {
        console.log(error)

    }

}

async function gemini(params) {
    const genAI = new GoogleGenerativeAI("AIzaSyDBaRLzpUSUpODcovsIhyEvtbeZimg9bHA");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

    const result = await model.generateContent(params);
    // console.log(result.response.text());
    return result.response.text();
}

module.exports = { findBPJS, cekRujukan, cekSttRujukan, sendWA, gemini }