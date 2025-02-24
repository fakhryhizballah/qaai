const fungsiModul = require('./fungsi.js'); // Import modul

let x = 'fungsiA'


// for (let item of x) {
//     if (typeof fungsiModul[item] === "function") {
//         fungsiModul[item](); // Panggil fungsi berdasarkan string
//     }
// }
fungsiModul[x]()