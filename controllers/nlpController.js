const { sendWA, gemini, cekPoli, ollama } = require("../helper/bpjs");
const { generateToken } = require("../helper/token");
const axios = require("axios");
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

const rolemodel = async (req, res) => {
    let { role, set } = req.body;
    let data = JSON.stringify({
        // "model": 'llama3.2:3b-instruct-q4_K_M',
        // "model": 'gemma4:e2b',
        "model": 'gemma4:e4b',
        "options": {
            "num_ctx": 1024,
        },
        "system": "Perbaiki kalimat promt agar lebih testruktur",
        "format": {
            "type": "object",
            "properties": {
                "prompt_original": {
                    "type": "string"
                },
                "prompt_fixed": {
                    "type": "string"
                }
            }
        },
        "prompt": role,
        "keep_alive": "1m",
        "stream": false
    });
    try {
        let request = await axios.post(process.env.OLAMA_HOST_LOCAL + '/generate', data, {
            headers: {
                // Authorization: "Bearer " + process.env.OLAMA_TOKEN,
                "Content-Type": "application/json",
                timeout: 2000 // only wait for 2s
            }
        });
        console.log(request);
        let result = JSON.parse(request.data.response)
        req.cache.set("rolemodel:" + set, result.prompt_fixed);
        return res.status(200).json({
            prompt_original: role,
            prompt_fixed: result.prompt_fixed,
            raw: request.data
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

const getRole = async (req, res) => {
    const keys = await req.cache.keys("rolemodel:*");

    // 2. Fetch all values (returns an array of strings or nulls)
    const results = keys.length > 0 ? await req.cache.mGet(keys) : [];

    return res.status(200).json({
        keys,
        results
    })
}
const chat = async (req, res) => {
    let { chatId } = req.query
    let { model, message, role, format, options } = req.body;
    let system = await req.cache.get("rolemodel:" + role)
    if (!system) {
        return res.status(401).json({
            message: "Role not found"
        })
    }
    let data
    let riwayat
    let findChat = await req.cache.json.get("OLAMA:chat:" + chatId);
    if (!findChat) {
        riwayat = [
            {
                "role": 'user',
                "content": message
            }
        ]
        data = JSON.stringify({
            "model": model,
            "messages": [
                {
                    "role": 'system',
                    "content": system
                },
                {
                    "role": 'user',
                    "content": message
                }
            ],
            format,
            options,
            "stream": false
        });
    }
    else {
        riwayat = findChat
        riwayat = riwayat.concat({
            "role": 'user',
            "content": message
        })

        data = JSON.stringify({
            "model": model,
            "messages": [
                ...findChat,
                {
                    "role": 'user',
                    "content": message
                }
            ],
            format,
            options,
            "stream": false
        });
    }


    try {
        console.log(data);
        let request = await axios.post(process.env.OLAMA_HOST_LOCAL + '/chat', data, {
            headers: {
                // Authorization: "Bearer " + process.env.OLAMA_TOKEN,
                "Content-Type": "application/json",
                timeout: 2000 // only wait for 2s
            }
        });
        console.log(request);

        riwayat = riwayat.concat(request.data.message)
        await req.cache.json.set("OLAMA:chat:" + chatId, '$', riwayat);
        return res.status(200).json(request.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }

}

module.exports = {
    processMessage,
    rolemodel,
    getRole,
    chat
};

 