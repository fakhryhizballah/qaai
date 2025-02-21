const tf = require('@tensorflow/tfjs');
const dataset = require('./dataset');

async function loadChatbot() {
    console.log("Memuat chatbot...");
    const model = await tf.loadLayersModel('file://./chatbot_model/model.json');
    console.log("Chatbot siap!");

    // Fungsi untuk menjawab pertanyaan
    function getResponse(inputText) {
        const inputTensor = textToTensor(inputText);
        const prediction = model.predict(inputTensor);
        const index = prediction.argMax(1).dataSync()[0];
        return dataset[index].output;
    }

    console.log("Bot: Halo! Apa yang ingin kamu tanyakan?");
    process.stdin.on("data", data => {
        const question = data.toString().trim();
        console.log("User:", question);
        console.log("Bot:", getResponse(question));
    });
}

loadChatbot();
