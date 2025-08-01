-- AlterTable
ALTER TABLE "MemorySettings" ADD COLUMN     "autoDeleteOnChatRemoval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shareMemoryAcrossChats" BOOLEAN NOT NULL DEFAULT true;
