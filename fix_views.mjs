import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.$executeRawUnsafe('ALTER TABLE "Campaign" ALTER COLUMN "views" TYPE TEXT USING views::text;');
        console.log("Migration complete!");
    } catch (e) {
        console.error("Migration fallback error, resetting column instead:", e.message);
        await prisma.$executeRawUnsafe('ALTER TABLE "Campaign" DROP COLUMN "views", ADD COLUMN "views" TEXT;');
        console.log("Fallback migration complete!");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
