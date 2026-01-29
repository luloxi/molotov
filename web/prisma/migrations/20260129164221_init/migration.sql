-- CreateTable
CREATE TABLE "ArtworkStats" (
    "id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtworkStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkLike" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkView" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkCategory" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtworkLike_tokenId_idx" ON "ArtworkLike"("tokenId");

-- CreateIndex
CREATE INDEX "ArtworkLike_userId_idx" ON "ArtworkLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkLike_tokenId_userId_key" ON "ArtworkLike"("tokenId", "userId");

-- CreateIndex
CREATE INDEX "ArtworkView_tokenId_idx" ON "ArtworkView"("tokenId");

-- CreateIndex
CREATE INDEX "ArtworkView_ipHash_idx" ON "ArtworkView"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "ArtworkCategory_tokenId_idx" ON "ArtworkCategory"("tokenId");

-- CreateIndex
CREATE INDEX "ArtworkCategory_categoryId_idx" ON "ArtworkCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkCategory_tokenId_categoryId_key" ON "ArtworkCategory"("tokenId", "categoryId");

-- AddForeignKey
ALTER TABLE "ArtworkLike" ADD CONSTRAINT "ArtworkLike_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ArtworkStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkView" ADD CONSTRAINT "ArtworkView_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ArtworkStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkCategory" ADD CONSTRAINT "ArtworkCategory_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ArtworkStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkCategory" ADD CONSTRAINT "ArtworkCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
