require("dotenv").config();
const express = require("express");
const nlpRoutes = require("./routes");

const app = express();
app.use(express.json());

app.use("/api/nlp", nlpRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
