const { NlpManager } = require("node-nlp");
const fs = require("fs");
const path = require("path");
const trainingData = require("../data/trainingData.json");

const MODEL_PATH = path.join(__dirname, "model.nlp");

const manager = new NlpManager({ languages: ["id"], forceNER: true });

// Cek apakah model sudah ada
if (fs.existsSync(MODEL_PATH)) {
    manager.load(MODEL_PATH);
    console.log("✅ Model NLP berhasil dimuat dari file!");
} else {
    console.log("🔄 Model belum tersedia, mulai melatih...");
    trainingData.forEach(({ intent, utterances, answers }) => {
        utterances.forEach((utterance) => manager.addDocument("id", utterance, intent));
        answers.forEach((answer) => manager.addAnswer("id", intent, answer));
    });

    // Fungsi untuk melatih dan menyimpan model
    const trainAndSaveModel = async () => {
        await manager.train();
        manager.save(MODEL_PATH);
        console.log("✅ Model NLP telah dilatih dan disimpan!");
    };

    trainAndSaveModel();
}

module.exports = manager;
