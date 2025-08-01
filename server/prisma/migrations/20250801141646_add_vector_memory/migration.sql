/*
  Warnings:

  - Made the column `messageId` on table `Attachment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Attachment" ALTER COLUMN "messageId" SET NOT NULL;

-- CreateTable
CREATE TABLE "VectorMemory" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT,
    "context" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,

    CONSTRAINT "VectorMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "maxMemoryEntries" INTEGER NOT NULL DEFAULT 10000,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "autoCleanupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VectorMemory_userId_idx" ON "VectorMemory"("userId");

-- CreateIndex
CREATE INDEX "VectorMemory_chatId_idx" ON "VectorMemory"("chatId");

-- CreateIndex
CREATE INDEX "VectorMemory_timestamp_idx" ON "VectorMemory"("timestamp");

-- CreateIndex
CREATE INDEX "VectorMemory_importanceScore_idx" ON "VectorMemory"("importanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "MemorySettings_userId_key" ON "MemorySettings"("userId");

-- AddForeignKey
ALTER TABLE "MemorySettings" ADD CONSTRAINT "MemorySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
