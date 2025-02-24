const axios = require('axios');
require('dotenv').config();
let { BPJSHOST } = process.env;


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

module.exports = { findBPJS, cekRujukan, cekSttRujukan, sendWA }