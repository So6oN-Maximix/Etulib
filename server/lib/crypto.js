const crypto = require("crypto");

if (!/^[0-9a-f]{64}$/i.test(process.env.MESSAGE_KEY_V1 || "")) throw new Error("MESSAGE_KEY_V1 manquante ou invalide dans le .env");
const KEYS = { v1: Buffer.from(process.env.MESSAGE_KEY_V1, "hex") };
const CURRENT = "v1";

function encryptMessage(plain, conversationId) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", KEYS[CURRENT], iv);
	cipher.setAAD(Buffer.from(String(conversationId)));
	const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	return [CURRENT, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

function decryptMessage(stored, conversationId) {
	const [version, iv, tag, data] = stored.split(":");
	if (!KEYS[version]) throw new Error("Version de clé inconnue");
	const decipher = crypto.createDecipheriv("aes-256-gcm", KEYS[version], Buffer.from(iv, "base64"));
	decipher.setAAD(Buffer.from(String(conversationId)));
	decipher.setAuthTag(Buffer.from(tag, "base64"));
	return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

module.exports = { encryptMessage, decryptMessage };