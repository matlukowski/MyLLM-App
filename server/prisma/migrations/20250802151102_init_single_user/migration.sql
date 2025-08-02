-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderType" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VectorMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "importanceScore" REAL NOT NULL DEFAULT 0.5,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT,
    "context" TEXT,
    "tags" TEXT NOT NULL,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "MemorySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "importanceThreshold" REAL NOT NULL DEFAULT 0.3,
    "maxMemoryEntries" INTEGER NOT NULL DEFAULT 10000,
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "autoCleanupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoDeleteOnChatRemoval" BOOLEAN NOT NULL DEFAULT true,
    "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
    "shareMemoryAcrossChats" BOOLEAN NOT NULL DEFAULT true,
    "memoryAggressiveness" TEXT NOT NULL DEFAULT 'conservative',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "VectorMemory_chatId_idx" ON "VectorMemory"("chatId");

-- CreateIndex
CREATE INDEX "VectorMemory_timestamp_idx" ON "VectorMemory"("timestamp");

-- CreateIndex
CREATE INDEX "VectorMemory_importanceScore_idx" ON "VectorMemory"("importanceScore");
