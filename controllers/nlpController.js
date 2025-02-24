const manager = require("../nlp/nlpModel");
const fungsiModul = require('../nlp/fungsi.js'); 
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
                [Op.gte]: new Date(Date.now() - 900 * 1000)
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
            return res.json({
                answer: dataSession.feedback_message,
            });
        }
        
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
        return res.json({
            intent: response.intent,
            answer: response.answer,
        });
    }
    res.json({
        // intent: response.intent,
        answer: response.answer || "Maaf, saya tidak mengerti. Coba tanyakan informasi ketersediaan kamar atau jadwal dokter.",
    });
};

module.exports = { processMessage };

 