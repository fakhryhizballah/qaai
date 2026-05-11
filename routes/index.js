const express = require("express");
const nlp = require("../controllers/nlpController");

const router = express.Router();

router.post("/message", nlp.processMessage);
router.post("/rolemodel", nlp.rolemodel);
router.get("/rolemodel", nlp.getRole);
router.post("/chat", nlp.chat);
router.post("/genrator", nlp.generaterator);

module.exports = router;
