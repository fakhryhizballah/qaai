const { Session } = require("../models");
const axios = require("axios");
const {
    findBPJS,
    cekRujukan,
    cekSttRujukan,
    cekDaftarPoli,
    cekDaftarDR,
    cekDaftarDRbpjs,
    regis,
} = require("../helper/bpjs");
const { where } = require("sequelize");
function question(params, dataSession) {
    if (params === "1" || params === "2") {
        console.log(params);
        Session.update(
            {
                feedback_message: null,
                status: 0,
                feedback_status: null,
                feedback_function: null,
            },
            {
            where: {
                    id: dataSession.id,
                },
            }
        );
    }
    if (params === "1") {
        return `Untuk mengetahui ketersediaan kamar secara realtime bisa di cek di KAIN RAJA
klik link berikut ini https://kainraja.rsudaa.singkawangkota.go.id/daftar-kamar`;
    }
    if (params === "2") {
        return `Untuk mengetahui jadwal praktek dokter bisa di cek di instagram RSUD dr. Abdul Aziz 
klik link berikut ini https://kainraja.rsudaa.singkawangkota.go.id/poli`;
    }

    return false;
}
function register(params, dataSession) {
    params = params.toLowerCase();
    if (params === "ya") {
        Session.update(
            {
                feedback_message: "mohon hanya ketik no KTP atau no BPJS pasein",
                status: 1,
                feedback_status: null,
                feedback_function: "cekPasien",
            },
            {
            where: {
                    id: dataSession.id,
                },
            }
        );
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
        let type = "";
        if (params.length == 16) {
            type = "nik";
        }
        if (params.length == 13) {
            type = "nokartu";
        }
        console.log(params, type);
        let dataNo = await findBPJS(params, type);
        console.log(dataNo.data);
        if (dataNo.data.metaData.code != 200) {
            return `Mohon Maaf No BPJS pasein atau no KTP anda belum terdaftar, silahkan hubungi Loket Pendaftaran RSUD dr Abdul Aziz.`;
        }
        console.log(dataNo.data.response.peserta);

        if (dataNo.data.response.peserta.mr.noMR == null) {
            return `Mohon maaf ${dataNo.data.response.peserta.nama}, silahkan hubungi Loket Pendaftaran RSUD dr Abdul Aziz. untuk validasi data`;
        }
        let data_rujukan = await cekRujukan(dataNo.data.response.peserta.noKartu);
        console.log(data_rujukan.data.response.rujukan);
        if (data_rujukan.data.metaData.code != 200) {
            return `Maaf anda tidak ada rujukan mau daftra sebagai peserta umum?`;
        }
        if (cekSttRujukan(data_rujukan.data.response.rujukan[0].tglKunjungan)) {
            Session.update(
                {
                    feedback_message:
                        "balas ya untuk mendaftar sebagai pasien umum, balas tidak untuk batal",
                    status: 1,
                    feedback_data: JSON.stringify(dataNo.data.response.peserta),
                    feedback_function: "daftarPXumum",
                },
                {
                where: {
                        id: dataSession.id,
                    },
                }
            );
            return `Maaf Rujukan ${data_rujukan.data.response.rujukan[0].peserta.nama} sudah habis silahkan minta ke faskes pertama ${data_rujukan.data.response.rujukan[0].provPerujuk.nama} untuk rujukan baru
Jika mau mendaftar sebagai pasien umum silahkan balas ya atau tidak`;
        }
        Session.update(
            {
                feedback_message: "balas ya atau tidak",
                status: 1,
                feedback_data: JSON.stringify(data_rujukan.data.response.rujukan[0]),
                feedback_function: "daftarPXbpjs",
            },
            {
            where: {
                    id: dataSession.id,
                },
            }
        );

        return `${data_rujukan.data.response.rujukan[0].peserta.nama} memiliki rujukan ke poli ${data_rujukan.data.response.rujukan[0].poliRujukan.nama} apakah ingin mendaftar ke poli ini atau ke poli lain? n\ balas ya atau tidak`;
    } else {
        Session.update(
            {
                feedback_message: "No KTP atau no BPJS pasein",
                status: 1,
                feedback_status: null,
                feedback_function: "cekPasien",
            },
            {
            where: {
                    id: dataSession.id,
                },
            }
        );
        return `no yang anda ketik ${params.length} digit, no BPJS pasein harus 13 digit atau no KTP harus 16 digit`;
    }
}
async function daftarPXbpjs(params, dataSession) {
    params = params.toLowerCase();
    let dataSesi = await Session.findOne({
        where: {
            id: dataSession.id,
        },
    });
    let feedback_data = JSON.parse(dataSesi.feedback_data);

    if (params == "ya" || params == "iya") {
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
        let tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
        let tanggal = tomorrow.toISOString().slice(0, 10);
        let jdlDr = await cekDaftarDRbpjs(feedback_data.poliRujukan.kode, tanggal);
        console.log(jdlDr.data.data[0]);
        let hasilRegis = await regis({
            no_rkm_medis: feedback_data.peserta.mr.noMR,
            tanggal_periksa: tanggal,
            kd_poli: jdlDr.data.data[0].kd_poli,
            jam_reg: jdlDr.data.data[0].jam_mulai,
            kd_dokter: jdlDr.data.data[0].dokter.kd_dokter,
            kd_pj: "BPJ",
        });

        return `baik, sudah di daftrakan ke poli ${feedback_data.poliRujukan.nama} dengan ${jdlDr.data.data[0].dokter.nm_dokter} 
No RM      : ${feedback_data.px.mr.noMR}
No Rawat   : ${hasilRegis.data.data.no_rawat}
No Antrian : ${hasilRegis.data.data.no_reg}
Silahkan datang lansgung ke poli pada tanggal ${tanggal} pukul ${jdlDr.data.data[0].jam_mulai}`;
    }
    if (params == "tidak") {
        let daftar_poli = await cekDaftarPoli();
        const filterKdPoli = [
            "-",
            "U0009",
            "U0056",
            "U0029",
            "IGDK",
            "U0054",
            "U0055",
        ];
        const filteredList = daftar_poli.data.data.filter(
            (item) => !filterKdPoli.includes(item.kd_poli)
        );

        Session.update(
            {
                feedback_message: "balas dengan angka untuk memilih poli",
                status: 1,
                feedback_data: JSON.stringify({
                    px: feedback_data,
                    poli: filteredList,
                }),
                feedback_function: "registerPXbpjs",
            },
            {
                where: {
                    id: dataSession.id,
                },
            }
        );
        return `baik, ${feedback_data.px.nama} silahkan pilih poli 
        ${filteredList
                .map((poli, i) => {
                    return `${i + 1}. ${poli.nm_poli}`;
                })
                .join("\n")} \nketik angka untuk memilih poli`;
    }

    return "oke";
}

async function daftarPXumum(params, dataSession) {
    params = (params || "").toLowerCase();
    let dataSesi = await Session.findOne({
        where: {
            id: dataSession.id,
        },
    });
    let feedback_data = JSON.parse(dataSesi.feedback_data);

    if (params == "ya" || params == "iya") {
        let daftar_poli = await cekDaftarPoli();
        const filterKdPoli = [
            "-",
            "U0009",
            "U0056",
            "U0029",
            "IGDK",
            "U0054",
            "U0055",
        ];
        const filteredList = daftar_poli.data.data.filter(
            (item) => !filterKdPoli.includes(item.kd_poli)
        );

        Session.update(
            {
                feedback_message: "balas dengan angka untuk memilih poli",
                status: 1,
                feedback_data: JSON.stringify({
                    px: feedback_data,
                    poli: filteredList,
                }),
                feedback_function: "registerPXumum",
            },
            {
                where: {
                    id: dataSession.id,
                },
            }
        );
        return `baik, ${feedback_data.nama} silahkan pilih poli 
        ${filteredList
                .map((poli, i) => {
                    return `${i + 1}. ${poli.nm_poli}`;
                })
                .join("\n")} \nketik angka untuk memilih poli`;
    }
    if (params == "tidak") {
        Session.update(
            {
                feedback_message: null,
                status: 0,
                feedback_status: null,
                feedback_function: null,
            },
            {
                where: {
                    id: dataSession.id,
                },
            }
        );
        return "baik terimakasih";
    }

    return;
}
async function registerPXumum(params, dataSession) {
    let dataSesi = await Session.findOne({
        where: {
            id: dataSession.id,
        },
    });
    let feedback_data = JSON.parse(dataSesi.feedback_data);
    let poli = parseInt(params);
    if (!feedback_data.poli[poli - 1]) {
        return "maaf angka yang anda ketik salah";
    }
    console.log(feedback_data.px);
    let tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
    let tanggal = tomorrow.toISOString().slice(0, 10);
    let jdlDr = await cekDaftarDR(feedback_data.poli[poli - 1].kd_poli, tanggal);
    console.log(jdlDr.data.data[0]);
    // let poli = feedback_data.poli[params - 1]
    // let noKartu = feedback_data.px.noKartu
    Session.update(
        {
            feedback_message: null,
            status: 0,
            feedback_status: null,
            feedback_function: null,
        },
        {
            where: {
                id: dataSession.id,
            },
        }
    );
    let hasilRegis = await regis({
        no_rkm_medis: feedback_data.px.mr.noMR,
        tanggal_periksa: tanggal,
        kd_poli: jdlDr.data.data[0].kd_poli,
        jam_reg: jdlDr.data.data[0].jam_mulai,
        kd_dokter: jdlDr.data.data[0].dokter.kd_dokter,
        kd_pj: "A09",
    });

    return `baik, ${feedback_data.px.nama} sudah kami daftarkan ke poli ${feedback_data.poli[poli - 1].nm_poli} dengan ${jdlDr.data.data[0].dokter.nm_dokter} 
No RM      : ${feedback_data.px.mr.noMR}
No Rawat   : ${hasilRegis.data.data.no_rawat}
No Antrian : ${hasilRegis.data.data.no_reg}
Silahkan datang lansgung ke poli pada tanggal ${tanggal} pukul ${jdlDr.data.data[0].jam_mulai}`;
}
async function registerPXbpjs(params, dataSession) {
    let dataSesi = await Session.findOne({
        where: {
            id: dataSession.id,
        },
    });
    let feedback_data = JSON.parse(dataSesi.feedback_data);
    let poli = parseInt(params);
    if (!feedback_data.poli[poli - 1]) {
        return "maaf angka yang anda ketik salah";
    }
    console.log(feedback_data.px);
    let tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
    let tanggal = tomorrow.toISOString().slice(0, 10);
    let jdlDr = await cekDaftarDR(feedback_data.poli[poli - 1].kd_poli, tanggal);
    // console.log(jdlDr.data.data[0]);
    // let poli = feedback_data.poli[params - 1]
    // let noKartu = feedback_data.px.noKartu
    Session.update(
        {
            feedback_message: null,
            status: 0,
            feedback_status: null,
            feedback_function: null,
        },
        {
            where: {
                id: dataSession.id,
            },
    }
    );
    let hasilRegis = await regis({
        no_rkm_medis: feedback_data.px.peserta.mr.noMR,
        tanggal_periksa: tanggal,
        kd_poli: jdlDr.data.data[0].kd_poli,
        jam_reg: jdlDr.data.data[0].jam_mulai,
        kd_dokter: jdlDr.data.data[0].dokter.kd_dokter,
        kd_pj: "BPJ",
    });

    return `baik, ${feedback_data.px.peserta.nama} sudah kami daftarkan ke poli ${feedback_data.poli[poli - 1].nm_poli} dengan ${jdlDr.data.data[0].dokter.nm_dokter} 
No RM      : ${feedback_data.px.mr.noMR}
No Rawat   : ${hasilRegis.data.data.no_rawat}
No Antrian : ${hasilRegis.data.data.no_reg}
Silahkan datang lansgung ke poli pada tanggal ${tanggal} pukul ${jdlDr.data.data[0].jam_mulai
        }`;
}

module.exports = {
    question,
    register,
    cekPasien,
    daftarPXbpjs,
    daftarPXumum,
    registerPXumum,
    registerPXbpjs,
};
