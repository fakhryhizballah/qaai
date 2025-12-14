const { sendWA, gemini, cekPoli, ollama } = require("../helper/bpjs");
const { generateToken } = require("../helper/token");
const { Session, Chatflow, sequelize } = require("../models");
const SECRET_OTP = process.env.SECRET_OTP

const { Op } = require("sequelize");

const processMessage = async (req, res) => {
    const { message, nowa } = req.body;
    if (!message || !nowa)
        return res.status(400).json({ error: "Message and nowa is required" });
    if (message.toLowerCase().includes("otp")) {
        if (nowa.includes("@lid")) {
            let findNowa = await req.cache.get("SIMPEG:lid:" + nowa);
            if (findNowa) {
                console.log(findNowa);
                let otp = generateToken(findNowa, SECRET_OTP);
                let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
                await sendWA(nowa, pesan);
                return res.json({
                    intent: "otp",
                    answer: null
                })
            }
            return res.json({
                intent: "NowaNotFound",
                answer: null
            })

        } else {
            let otp = generateToken(nowa, SECRET_OTP);
            let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
            await sendWA(nowa, pesan);
            return res.json({
                intent: "otp",
                answer: null
            })
        }

    }
    // if (message.toLowerCase() == "otp") {
    //     let otp = generateToken(nowa, SECRET_OTP);
    //     let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
    //     await sendWA(nowa, pesan);
    //     return res.json({
    //         intent: "otp",
    //         answer: pesan
    //     })

    // }
    let findChatflow = await Chatflow.findAll({
        where: {
            nowa: nowa,
            updatedAt: {
                [Op.gte]: new Date(Date.now() - 60 * 60 * 1000)
            }
        }
    })
    if (findChatflow.length > 0) {
        console.log(findChatflow);
        if (findChatflow[findChatflow.length - 1].stage == 2) {
            return res.json({
                intent: findChatflow[findChatflow.length - 1].stage,
                answer: "sesi chat habis",
            })
        }
        let newChat = await ollama([{
            "role": "assistant",
            "content": findChatflow[findChatflow.length - 1].feedback_message
        }, {
            "role": "user",
            "content": message
        }]);
        console.log(newChat);
        console.log(typeof newChat.message.content);
        await Chatflow.create({
            nowa: nowa,
            message: message,
            role: "user",
            feedback_message: newChat.message.content,
            stage: 2
        });
        sendWA(nowa, newChat.message.content)
        return res.json({
            intent: findChatflow[findChatflow.length - 1].stage,
            answer: newChat.message.content,
        })
    } else {
        let newChat = await ollama([{
            "role": "user",
            "content": message
        }]);
        console.log(newChat);
        console.log(typeof newChat.message.content);
        await Chatflow.create({
            nowa: nowa,
            message: message,
            role: "user",
            feedback_message: newChat.message.content,
            stage: 1
        });
        sendWA(nowa, newChat.message.content)
        return res.json({
            intent: 1,
            answer: newChat.message.content,
        })
    }
};

module.exports = { processMessage };

 