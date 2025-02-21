const tf = require('@tensorflow/tfjs');
const qna = require('@tensorflow-models/qna');
const readline = require('readline');
const fs = require('fs');

// Muat konteks dari file JSON
const contexts = JSON.parse(fs.readFileSync('context.json', 'utf8'));

// Fungsi untuk memuat model BERT
async function loadModel() {
    console.log("Memuat model BERT...");
    const model = await qna.load();
    console.log("Model BERT berhasil dimuat!");
    return model;
}

// Fungsi untuk memilih konteks berdasarkan pertanyaan
function getContext(question) {
    if (question.toLowerCase().includes("bert")) return contexts.bert;
    if (question.toLowerCase().includes("tensorflow")) return contexts.tensorflow;
    if (question.toLowerCase().includes("javascript")) return contexts.javascript;
    return "Maaf, saya tidak memiliki informasi tentang itu.";
}

// Fungsi utama chatbot
async function chatbot() {
    const model = await loadModel();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\nChatbot siap! Ketik pertanyaanmu atau 'exit' untuk keluar.");
    rl.setPrompt("> ");
    rl.prompt();

    rl.on("line", async (question) => {
        if (question.toLowerCase() === "exit") {
            rl.close();
            return;
        }

        const context = getContext(question);
        const answers = await model.findAnswers(question, context);

        if (answers.length > 0) {
            console.log("Jawaban:", answers[0].text);
        } else {
            console.log("Maaf, saya tidak tahu jawabannya.");
        }

        rl.prompt();
    });

    rl.on("close", () => {
        console.log("Chatbot BERT telah selesai.");
        process.exit(0);
    });
}

// Jalankan chatbot
chatbot();
