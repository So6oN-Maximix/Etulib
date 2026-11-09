const test = require("node:test");
const assert = require("node:assert");

process.env.MESSAGE_KEY_V1 ||= "0".repeat(64);
const { encryptMessage, decryptMessage } = require("../lib/crypto");

const text = "Bonjour, ça va ? 😀 Élève de 1ère, à mercredi !";

test("aller-retour : on retrouve le texte d'origine", () => {
	assert.strictEqual(decryptMessage(encryptMessage(text, 42), 42), text);
});

test("le même texte chiffré deux fois donne deux résultats différents", () => {
	assert.notStrictEqual(encryptMessage(text, 42), encryptMessage(text, 42));
});

test("le texte en clair n'apparaît pas dans la valeur stockée", () => {
	assert.ok(!encryptMessage(text, 42).includes("Bonjour"));
});

test("une autre conversation ne peut pas déchiffrer", () => {
	assert.throws(() => decryptMessage(encryptMessage(text, 42), 43));
});

test("un message modifié dans la base est refusé", () => {
	const parts = encryptMessage(text, 42).split(":");
	const bytes = Buffer.from(parts[3], "base64");
	bytes[0] ^= 1;
	parts[3] = bytes.toString("base64");
	assert.throws(() => decryptMessage(parts.join(":"), 42));
});

test("texte vide et texte long", () => {
	assert.strictEqual(decryptMessage(encryptMessage("", 1), 1), "");
	const long = "a".repeat(2000);
	assert.strictEqual(decryptMessage(encryptMessage(long, 1), 1), long);
});