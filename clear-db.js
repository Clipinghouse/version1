const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Clearing diagnostic testing data...");

    // Clear relations and standalone domains
    await prisma.storedContent.deleteMany({});

    // Many to many implicitly handled, but delete the core items
    // Order matters sometimes for foreign keys but deleteMany usually handles it 
    // or we delete children first
    await prisma.contextItem.deleteMany({});
    await prisma.contextCategory.deleteMany({});
    await prisma.campaign.deleteMany({});

    console.log("Database successfully cleaned. Ready for fresh production data!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
