const manager = require("../nlp/nlpModel");
const axios = require('axios');
const fungsiModul = require('../nlp/fungsi.js'); 
const { sendWA, gemini, cekPoli } = require("../helper/bpjs");
const { Session } = require("../models");

const { Op } = require("sequelize");

const processMessage = async (req, res) => {
    const { message, nowa } = req.body;
    if (!message || !nowa)
        return res.status(400).json({ error: "Message and nowa is required" });

    let dataSession = await Session.findOne({ 
        where: {
            nowa: nowa,
            updatedAt: {
                [Op.gte]: new Date(Date.now() - 150 * 1000)
            },
            
        }
    });
    if (!dataSession) {
    dataSession = await Session.create({
            nowa: nowa,
            message: message,
            status: 0,
        });
    }
    console.log(dataSession);

    if (dataSession.status === 1) {
        const answer = await fungsiModul[dataSession.feedback_function](message, dataSession);
        if (!answer) {

            sendWA(nowa, dataSession.feedback_message)
            return res.json({
                answer: dataSession.feedback_message,
            });
        }
        sendWA(nowa, answer)
        
        return res.json({
            answer: answer,
        });
       
    }

    const response = await manager.process("id", message);
    if (response.intent === "question") {
        Session.update({
            feedback_message: "Balas dengan angka 1 atau 2",
            status: 1,
            feedback_status: null,
            feedback_function: "question"
        }, {
            where: {
                id: dataSession.id
            }
        });
        sendWA(nowa, response.answer)
        return res.json({
            intent: response.intent,
            answer: response.answer,
        });
    }
    if (response.intent === "register") {
        Session.update({
            feedback_message: "Balas dengan angka Ya atau Tidak",
            status: 1,
            feedback_status: null,
            feedback_function: "register"
        }, {
            where: {
                id: dataSession.id
            }
        });
        sendWA(nowa, response.answer)
        return res.json({
            intent: response.intent,
            answer: response.answer,
        });
    }
    // sendWA(nowa, response.answer)

    if (response.answer == undefined) {
        let dataGemini = await gemini(message)
        console.log(typeof dataGemini)
        sendWA(nowa, dataGemini)

        return res.json({
            intent: response.intent,
            answer: dataGemini.toString(),
        });
    }
    sendWA(nowa, response.answer)
    return res.json({
        intent: response.intent,
        answer: response.answer || "Maaf, saya tidak mengerti. Coba tanyakan informasi ketersediaan kamar atau jadwal dokter.",
    });
};

module.exports = { processMessage };

 