/*
  Warnings:

  - The primary key for the `Repl` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ReplShare` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_ReplShare" DROP CONSTRAINT "_ReplShare_A_fkey";

-- AlterTable
ALTER TABLE "Repl" DROP CONSTRAINT "Repl_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Repl_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Repl_id_seq";

-- AlterTable
ALTER TABLE "_ReplShare" DROP CONSTRAINT "_ReplShare_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_ReplShare_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_ReplShare" ADD CONSTRAINT "_ReplShare_A_fkey" FOREIGN KEY ("A") REFERENCES "Repl"("id") ON DELETE CASCADE ON UPDATE CASCADE;
