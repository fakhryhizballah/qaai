const { Session } = require("../models");
const axios = require('axios');
const { findBPJS, cekRujukan, cekSttRujukan } = require("../helper/bpjs");
const { where } = require("sequelize");
function question(params, dataSession) {
    if (params === "1" || params === "2") {
        console.log(params);
        Session.update({
            feedback_message: null,
            status: 0,
            feedback_status: null,
            feedback_function: null
        }, {
            where: {
                id: dataSession.id
            }
        });
    }
    if (params === "1") {
        return `Untuk mengetahui ketersediaan kamar secara realtime bisa di cek di KAIN RAJA
        klik link berikut ini https://kainraja.rsudaa.singkawangkota.go.id/daftar-kamar`;
    }
    if (params === "2") {
        return `Untuk mengetahui jadwal praktek dokter bisa di cek di instagram RSUD dr. Abdul Aziz 
        klik link berikut ini https://www.instagram.com/rsudabdulaziz/`;
    }

    return false;
}
function register(params, dataSession) {
    params = params.toLowerCase();
    if (params === "ya") {
        Session.update({
            feedback_message: "mohon hanya ketik no KTP atau no BPJS pasein",
            status: 1,
            feedback_status: null,
            feedback_function: "cekPasien"
        }, {
            where: {
                id: dataSession.id
            }
        });
        return "Ketik no KTP atau no BPJS pasein yang mau di daftarkan";
    }
    if (params === "tidak" || params === "belum") {
        return `Silahkan datang lansgung ke poli rawat jalan 
        senin sd sabtu pukul 08.00 sd 12.00`;
    }
    return false;
}

async function cekPasien(params, dataSession) {
    console.log(params.length);
    if (params.length == 16 || params.length == 13) {
        let type = ""
        if (params.length == 16) {
            type = "nik"
        }
        if (params.length == 13) {
            type = "nokartu"
        }
        console.log(params, type);
        let dataNo = await findBPJS(params, type);
        console.log(dataNo.data);
        if (dataNo.data.metaData.code != 200) {
            return `Mohon Maaf No BPJS pasein atau no KTP anda belum terdaftar, silahkan hubungi Loket Pendaftaran RSUD dr Abdul Aziz.`
        }
        console.log(dataNo.data.response.peserta)

        if (dataNo.data.response.peserta.mr.noMR == null) {
            return `Mohon maaf ${dataNo.data.response.peserta.nama}, silahkan hubungi Loket Pendaftaran RSUD dr Abdul Aziz. untuk validasi data`
        }
        let data_rujukan = await cekRujukan(dataNo.data.response.peserta.noKartu)
        console.log(data_rujukan.data.response.rujukan)
        if (data_rujukan.data.metaData.code != 200) {
            return `Maaf anda tidak ada rujukan mau daftra sebagai peserta umum?`
        }
        if (cekSttRujukan(data_rujukan.data.response.rujukan[0].tglKunjungan)) {
            Session.update({
                feedback_message: null,
                status: 0,
                feedback_status: null,
                feedback_function: null
            }, {
                where: {
                    id: dataSession.id
                }
            });
            return `Maaf Rujukan ${data_rujukan.data.response.rujukan[0].peserta.nama} sudah habis silahkan minta ke faskes pertama ${data_rujukan.data.response.rujukan[0].provPerujuk.nama}`
        }
        Session.update({
            feedback_message: "balas ya atau tidak",
            status: 1,
            feedback_data: JSON.stringify(data_rujukan.data.response.rujukan[0]),
            feedback_function: "cekPoli"
        }, {
            where: {
                id: dataSession.id
            }
        });


        return `${data_rujukan.data.response.rujukan[0].peserta.nama} memiliki rujukan ke poli ${data_rujukan.data.response.rujukan[0].poliRujukan.nama} apakah ingin mendaftar ke poli ini atau ke poli lain? n\ balas ya atau tidak`


    } else {

        Session.update({
            feedback_message: "No KTP atau no BPJS pasein",
            status: 1,
            feedback_status: null,
            feedback_function: "cekPasien"
        }, {
            where: {
                id: dataSession.id
            }
        });
        return `no yang anda ketik ${params.length} digit, no BPJS pasein harus 13 digit atau no KTP harus 16 digit`;

    }

}
async function cekPoli(params, dataSession) {
    params = params.toLowerCase();
    let dataSesi = await Session.findOne({
        where: {
            id: dataSession.id
        }
    })
    let feedback_data = JSON.parse(dataSesi.feedback_data)
    Session.update({
        feedback_message: null,
        status: 0,
        feedback_status: null,
        feedback_function: null
    }, {
        where: {
            id: dataSession.id
        }
    });
    if (params == 'ya') {
        return `baik sudah di daftrakan ke poli ${feedback_data.poliRujukan.nama} untuk besok yaa`

    }
    if (params == 'tidak') {
        return 'hmm ini masih percobaan sih...'
    }

    return 'oke'

}

module.exports = {
    question,
    register,
    cekPasien,
    cekPoli
}