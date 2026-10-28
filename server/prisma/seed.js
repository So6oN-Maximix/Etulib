const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tutorsData = [
	{
		firstName: "Camille",
		lastName: "Moreau",
		email: "camille.moreau@example.com",
		phone: "0612345678",
		city: 42218, // Code INSEE Saint-Étienne
		bio: "Agrégée de mathématiques avec 8 ans d'expérience en accompagnement personnalisé.",
		courses: [
			{
				title: "Soutien approfondi Maths Lycée & Prépa",
				subject: "Mathématiques",
				level: "LYCEE",
				bio: "Préparation intensive au Baccalauréat et aux concours post-bac.",
				hourlyRate: 32,
				duration: 60,
				mode: "TOUS"
			}
		]
	},
	{
		firstName: "Thomas",
		lastName: "Rousseau",
		email: "thomas.rousseau@example.com",
		phone: "0623456789",
		city: 42218, // Saint-Étienne
		bio: "Ingénieur diplômé, passionné par la pédagogie et les méthodes de travail efficaces.",
		courses: [
			{
				title: "Remise à niveau et méthodologie en Maths",
				subject: "Mathématiques",
				level: "COLLEGE",
				bio: "Méthode axée sur les exercices types et la reprise de confiance.",
				hourlyRate: 25,
				duration: 60,
				mode: "DOMICILE"
			},
			{
				title: "Physique-Chimie Lycée",
				subject: "Physique-Chimie",
				level: "LYCEE",
				bio: "Cours structurés pour comprendre le cours et réussir les TP/épreuves.",
				hourlyRate: 28,
				duration: 60,
				mode: "EN_LIGNE"
			}
		]
	},
	{
		firstName: "Inès",
		lastName: "Khlifi",
		email: "ines.khlifi@example.com",
		phone: "0634567890",
		city: 69123, // Code INSEE Lyon
		bio: "Étudiante en Master 2 de Mathématiques, spécialisée dans le soutien au collège et lycée.",
		courses: [
			{
				title: "Cours de Maths Collège & Seconde",
				subject: "Mathématiques",
				level: "COLLEGE",
				bio: "Explications claires, exercices progressifs et accompagnement bienveillant.",
				hourlyRate: 22,
				duration: 60,
				mode: "TOUS"
			}
		]
	},
	{
		firstName: "Paul",
		lastName: "Dubois",
		email: "paul.dubois@example.com",
		phone: "0645678901",
		city: 75056, // Code INSEE Paris
		bio: "Professeur certifié en poste avec 12 ans d'expérience en établissement.",
		courses: [
			{
				title: "Préparation Spécialité Maths Terminale",
				subject: "Mathématiques",
				level: "SUP",
				bio: "Accompagnement vers l'enseignement supérieur et révisions Bac.",
				hourlyRate: 40,
				duration: 90,
				mode: "EN_LIGNE"
			}
		]
	}
];

async function main() {
	console.log("Création des tuteurs de test...");

	for (const tutor of tutorsData) {
		await prisma.user.create({
			data: {
				firstName: tutor.firstName,
				lastName: tutor.lastName,
				email: tutor.email,
				passwordHash: "$2b$10$e84S2O3j2M/M3j3i5l.2u.M/sXjGfE.KxK1WjO4pG1q.q2e8.2.", // mdp factice
				role: "TUTOR",
				tutor: {
					create: {
						phone: tutor.phone,
						city: tutor.city,
						bio: tutor.bio,
						subjects: {
							create: tutor.courses
						}
					}
				}
			}
		});
	}
	console.log("Seeding terminé avec succès !");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});