/*
  Warnings:

  - Added the required column `language` to the `Repl` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repl" ADD COLUMN     "language" TEXT NOT NULL;
