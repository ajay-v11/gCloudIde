-- CreateTable
CREATE TABLE "_ReplShare" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReplShare_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ReplShare_B_index" ON "_ReplShare"("B");

-- AddForeignKey
ALTER TABLE "_ReplShare" ADD CONSTRAINT "_ReplShare_A_fkey" FOREIGN KEY ("A") REFERENCES "Repl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReplShare" ADD CONSTRAINT "_ReplShare_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
