async function fungsiA() {
    console.log("Ini adalah fungsi A");
}

function fungsiB() {
    console.log("Ini adalah fungsi B");
}

// Ekspor fungsi dalam objek
module.exports = { fungsiA, fungsiB };
