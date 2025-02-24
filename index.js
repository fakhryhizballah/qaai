const { NlpManager } = require('node-nlp');


const manager = new NlpManager({ languages: ['id'] });

// Tambahkan pertanyaan dan jawaban
manager.addDocument('id', 'Apa itu NLP?', 'nlp.pengertian');
manager.addDocument('id', 'Bagaimana cara kerja NLP?', 'nlp.cara_kerja');

manager.addAnswer('id', 'nlp.pengertian', 'NLP adalah pemrosesan bahasa alami.');
manager.addAnswer('id', 'nlp.pengertian', 'NLP adalah gak tau apa.');
manager.addAnswer('id', 'nlp.cara_kerja', 'NLP bekerja dengan analisis teks menggunakan AI.');

(async () => {
    await manager.train();
    manager.save();

    const response = await manager.process('id', 'Hii');
    console.log(response.intent);
    if (response.intent != 'None') {
        console.log(response.answer);
    }
    console.log("Maaf, saya tidak mengerti pertanyaanmu.");
})();
