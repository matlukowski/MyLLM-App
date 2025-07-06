-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;
