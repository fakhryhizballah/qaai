const qna = require('@tensorflow-models/qna');
const tf = require('@tensorflow/tfjs');

async function loadModel() {
    console.log("Memuat model BERT...");
    const model = await qna.load();
    console.log("Model berhasil dimuat!");
    return model;
}

async function askQuestion(model, question, context) {
    const answers = await model.findAnswers(question, context);
    console.log("Jawaban:", answers);
}

(async () => {
    const model = await loadModel();
    const context = "BERT adalah model NLP dari Google yang digunakan untuk memahami teks.";
    const question = "Apa itu BERT?";

    await askQuestion(model, question, context);
})();
