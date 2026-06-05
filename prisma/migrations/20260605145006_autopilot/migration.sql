-- CreateTable
CREATE TABLE "AutopilotConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "leadsPerRun" INTEGER NOT NULL DEFAULT 10,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "brief" TEXT,
    "chatId" TEXT,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RunTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "brief" TEXT,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "RunTrigger_createdAt_idx" ON "RunTrigger"("createdAt");
