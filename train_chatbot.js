const tf = require('@tensorflow/tfjs');
const dataset = require('./dataset');

// Konversi teks menjadi angka (encoding sederhana)
const wordToIndex = {};
let index = 1;
dataset.forEach(item => {
    item.input.split(" ").forEach(word => {
        if (!wordToIndex[word]) wordToIndex[word] = index++;
    });
});

// Fungsi untuk mengubah teks menjadi tensor
function textToTensor(text) {
    const encoded = text.split(" ").map(word => wordToIndex[word] || 0);
    return tf.tensor2d([encoded], [1, encoded.length]);
}

// Buat model chatbot
const model = tf.sequential();
model.add(tf.layers.dense({ units: 8, inputShape: [3] }));
model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
model.add(tf.layers.dense({ units: dataset.length, activation: 'softmax' }));

// Kompilasi model
model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

// Konversi data ke tensor
const xs = tf.tensor2d(dataset.map(d => textToTensor(d.input).arraySync()[0]), [dataset.length, 3]);
const ys = tf.tensor2d(dataset.map((_, i) => {
    const label = Array(dataset.length).fill(0);
    label[i] = 1;
    return label;
}), [dataset.length, dataset.length]);

// Latih model
async function train() {
    console.log("Melatih chatbot...");
    await model.fit(xs, ys, { epochs: 500 });
    console.log("Model chatbot selesai dilatih!");

    // Simpan model
    await model.save('file://./chatbot_model');
    console.log("Model chatbot disimpan!");
}

train();
