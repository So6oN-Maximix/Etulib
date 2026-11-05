require("dotenv").config();
process.env.MESSAGE_KEY_V1 ||= require("crypto").randomBytes(32).toString("hex");   // clé jetable si elle n'est pas dans le .env

const assert = require("node:assert");
const { encryptMessage, decryptMessage } = require("./lib/crypto");

const text = "Très bien et vous? Prêt pour notre cours ?";

// 1. aller-retour : on retrouve exactement le texte d'origine
const stored = encryptMessage(text, 4);
console.log("stocké en base :", stored);
assert.strictEqual(decryptMessage(stored, 4), text);

// 2. le même texte chiffré deux fois donne deux résultats différents (IV aléatoire)
assert.notStrictEqual(encryptMessage(text, 4), stored);

// 3. le texte en clair n'apparaît pas dans ce qui est stocké
assert.ok(!stored.includes("Bonjour"));

// 4. une autre conversation ne peut pas déchiffrer ce message
assert.throws(() => decryptMessage(stored, 43));

// 5. un message modifié dans la base est refusé
const parts = stored.split(":");
const bytes = Buffer.from(parts[3], "base64");
bytes[0] ^= 1;
parts[3] = bytes.toString("base64");
assert.throws(() => decryptMessage(parts.join(":"), 4));

// 6. cas limites : texte vide et texte long
assert.strictEqual(decryptMessage(encryptMessage("", 1), 1), "");
const long = "a".repeat(2000);
assert.strictEqual(decryptMessage(encryptMessage(long, 1), 1), long);

console.log("Tous les tests passent.");