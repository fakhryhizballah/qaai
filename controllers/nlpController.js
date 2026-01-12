const { sendWA, gemini, cekPoli, ollama } = require("../helper/bpjs");
const { generateToken } = require("../helper/token");
// const { Chatflow, sequelize } = require("../models");
const SECRET_OTP = process.env.SECRET_OTP

const { Op } = require("sequelize");

const processMessage = async (req, res) => {
    const { message, nowa, oldMessages, reply } = req.body;
    const replyto = reply || process.env.HOSTWA
    if (!message || !nowa)
        return res.status(400).json({ error: "Message and nowa is required" });
    if (message.toLowerCase().includes("otp")) {
        if (nowa.includes("@lid")) {
            let findNowa = await req.cache.get("SIMPEG:lid:" + nowa);
            if (findNowa) {
                console.log(findNowa);
                let otp = generateToken(findNowa, SECRET_OTP);
                let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
                await sendWA(nowa, pesan, replyto);
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
            await sendWA(nowa, pesan, replyto);
            return res.json({
                intent: "otp",
                answer: null
            })
        }

    }
    // console.log(oldMessages);
    if (!oldMessages) {
        return res.json({
            intent: "default",
            answer: null
        })
    } else {
        const assistants = process.env.OLAMA_ASISTEN || [];
        const mapped = oldMessages
            .filter(m => m?.body) // skip empty
            .map(m => ({
                role: assistants.includes(m.from.user) ? 'assistant' : 'user',
                content: m.body.trim()
            }));
        console.log(mapped);
        let newChat = await ollama([{
            "role": "user",
            "content": message
        }]);
        console.log(newChat);
        console.log(typeof newChat.message.content);
        await sendWA(nowa, newChat.message.content, replyto)
        return res.json({
            intent: "default",
            answer: newChat
        })
    }

};

module.exports = { processMessage };

 