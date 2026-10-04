require("dotenv").config();
const { sendWA, gemini, cekPoli, ollama } = require("../helper/bpjs");
const { generateToken } = require("../helper/token");
const fs = require("fs/promises");
const path = require("path");
const OpenAI = require("openai");
const {
    saveSession,
    loadSession,
    trimSessionHistory,
    toolDefinitions,
    executeTool
} = require("../helper/session");
const SECRET_OTP = process.env.SECRET_OTP
console.log(process.env.OLAMA_HOST)
const openaiCompletions = new OpenAI({
    apiKey: process.env.OLAMA_TOKEN,
    baseURL: process.env.OLAMA_HOST || "https://api.openai.com/v1",
});

const processMessage = async (req, res) => {
    const { message, nowa, oldMessages, replay } = req.body;
    const replyto = replay || process.env.HOSTWA
    if (!message || !nowa || !replyto)
        return res.status(400).json({ error: "Message and nowa is required" });
    if (message.toLowerCase().includes("otp")) {
        if (nowa.includes("@lid")) {
            let findNowa = await req.cache.get("SIMPEG:lid:" + nowa);
            if (findNowa) {
                let otp = generateToken(findNowa, SECRET_OTP);
                let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
                sendWA(nowa, pesan, replyto);
                return res.json({
                    intent: "otp",
                    answer: null
                })
            }
            return res.json({
                intent: "otp",
                answer: "Maaf, anda belum terdaftar di SIMPEG"
            })

        } else {
            let otp = generateToken(nowa, SECRET_OTP);
            let pesan = `Kode OTP anda adalah *${otp}* \nKode ini akan kadaluarsa dalam 1 menit.`
            sendWA(nowa, pesan, replyto);
            return res.json({
                intent: "otp",
                answer: null
            })
        }

    }
    // console.log(oldMessages);
    const safeNamaSesi = nowa.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeNamaSesi) {
        return res.status(400).json({ error: "Invalid nama_sesi format" });
    }

    const SESSION_FILE = path.resolve(`session-${safeNamaSesi}.json`);
    const savedMessages = await loadSession(SESSION_FILE);
    const skillPath = path.join(process.cwd(), 'helper/baserole.md');

    const skillContent = await fs.readFile(skillPath, 'utf-8');
    const sessionMessages = [
        { role: "system", content: skillContent },
        ...savedMessages,
    ];
    sessionMessages.push({ role: "user", content: message });
    trimSessionHistory(sessionMessages);

    const response = await openaiCompletions.chat.completions.create({
        model: process.env.OLAMA_MODEL,
        messages: sessionMessages,
        tools: toolDefinitions,
        tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    sessionMessages.push(responseMessage);

    if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
            const fnName = toolCall.function.name;
            const fnArgs = JSON.parse(toolCall.function.arguments);

            console.log(`[AGEN AKSI]: Memanggil tool -> ${fnName} untuk user ${nowa}`);

            // 3. Sertakan parameter `nowa` agar memori tersimpan spesifik per user di MongoDB
            const result = await executeTool(fnName, fnArgs, nowa);
            console.log(`[HASIL TOOL]: ${result}\n`);

            sessionMessages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: fnName,
                content: result,
            });
        }

        const finalResponse = await openaiCompletions.chat.completions.create({
            model: process.env.OLAMA_MODEL,
            messages: sessionMessages,
        });

        console.log(`[ASISTEN IT]:\n${finalResponse.choices[0].message.content}`);
        await saveSession(SESSION_FILE, sessionMessages);
        await sendWA(nowa, finalResponse.choices[0].message.content, replyto)
        return res.json({ answer: finalResponse.choices[0].message.content, intent: responseMessage.tool_calls });
    } else {
        console.log(`[ASISTEN IT]:\n${responseMessage.content}`);

    }

    await saveSession(SESSION_FILE, sessionMessages);
    await sendWA(nowa, responseMessage.content, replyto)
    return res.json({ answer: responseMessage.content, intent: null });


};

module.exports = { processMessage };

 