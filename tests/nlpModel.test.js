const manager = require("../src/models/nlpModel");

test("NLP Model should classify 'Halo' as 'greeting'", async () => {
    const response = await manager.process("id", "Halo");
    expect(response.intent).toBe("greeting");
});
