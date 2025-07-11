/*
  Warnings:

  - You are about to drop the column `filename` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `messageId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `mimetype` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Message` table. All the data in the column will be lost.
  - Added the required column `chatId` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('TEXT', 'IMAGE');

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_messageId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "filename",
DROP COLUMN "messageId",
DROP COLUMN "mimetype",
DROP COLUMN "path",
DROP COLUMN "size",
ADD COLUMN     "base64Data" TEXT,
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "content" TEXT,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "fileSize" BIGINT NOT NULL,
ADD COLUMN     "fileType" "FileType" NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "role";

-- DropEnum
DROP TYPE "MessageRole";

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
