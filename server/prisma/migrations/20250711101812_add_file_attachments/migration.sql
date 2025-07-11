-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "role" "MessageRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT,
    "content" TEXT,
    "base64Data" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
