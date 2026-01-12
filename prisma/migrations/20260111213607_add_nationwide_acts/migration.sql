-- CreateTable
CREATE TABLE "NationwideAct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "NationwideAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NationwideActToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NationwideActToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "NationwideAct_name_key" ON "NationwideAct"("name");

-- CreateIndex
CREATE INDEX "_NationwideActToStudent_B_index" ON "_NationwideActToStudent"("B");

-- AddForeignKey
ALTER TABLE "_NationwideActToStudent" ADD CONSTRAINT "_NationwideActToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "NationwideAct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NationwideActToStudent" ADD CONSTRAINT "_NationwideActToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
