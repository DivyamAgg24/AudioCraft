-- CreateTable
CREATE TABLE "AudioBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "originalFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AudioBook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AudioBook" ADD CONSTRAINT "AudioBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
