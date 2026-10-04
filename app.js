require("dotenv").config();
const express = require("express");
const nlpRoutes = require("./routes");
const mongoose = require('mongoose');
const { createClient } = require('redis');

const app = express();
app.use(express.json());
const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_URL_PORT
    }
});
client.connect();
client.on('connect', () => {
    console.log('Redis client connected');
});
client.on('error', (err) => {
    console.log('Something went wrong ' + err);
});
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Terhubung ke MongoDB!'))
    .catch(err => console.error('Gagal terhubung ke MongoDB:', err));
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

app.use((req, res, next) => {
    req.cache = client;
    next();
});

app.use("/api/nlp", nlpRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
