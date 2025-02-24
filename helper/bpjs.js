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

module.exports = { findBPJS, cekRujukan, cekSttRujukan }