-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "source" TEXT,
    "workflowName" TEXT,
    "rawBrief" TEXT,
    "requestedCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "stats" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowRunId" TEXT,
    "email" TEXT,
    "companyName" TEXT,
    "website" TEXT,
    "country" TEXT,
    "city" TEXT,
    "niche" TEXT,
    "sourceUrl" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" TEXT,
    "dedupeKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadEvent_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowRunId" TEXT,
    "email" TEXT,
    "companyName" TEXT,
    "subject" TEXT,
    "eventType" TEXT NOT NULL,
    "status" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "dedupeKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "leadsFound" INTEGER NOT NULL DEFAULT 0,
    "emailsGenerated" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "followupsSent" INTEGER NOT NULL DEFAULT 0,
    "repliesDetected" INTEGER NOT NULL DEFAULT 0,
    "bouncesDetected" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IncomingEmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "emailLower" TEXT,
    "fromName" TEXT,
    "subject" TEXT,
    "messageId" TEXT,
    "threadId" TEXT,
    "eventType" TEXT NOT NULL,
    "receivedAt" DATETIME,
    "snippet" TEXT,
    "metadata" TEXT,
    "dedupeKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRun_runId_key" ON "WorkflowRun"("runId");

-- CreateIndex
CREATE INDEX "WorkflowRun_createdAt_idx" ON "WorkflowRun"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEvent_dedupeKey_key" ON "LeadEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "LeadEvent_createdAt_idx" ON "LeadEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LeadEvent_eventType_idx" ON "LeadEvent"("eventType");

-- CreateIndex
CREATE INDEX "LeadEvent_email_idx" ON "LeadEvent"("email");

-- CreateIndex
CREATE INDEX "LeadEvent_workflowRunId_idx" ON "LeadEvent"("workflowRunId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_dedupeKey_key" ON "EmailEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailEvent_createdAt_idx" ON "EmailEvent"("createdAt");

-- CreateIndex
CREATE INDEX "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "EmailEvent_email_idx" ON "EmailEvent"("email");

-- CreateIndex
CREATE INDEX "EmailEvent_status_idx" ON "EmailEvent"("status");

-- CreateIndex
CREATE INDEX "EmailEvent_workflowRunId_idx" ON "EmailEvent"("workflowRunId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingEmailEvent_dedupeKey_key" ON "IncomingEmailEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "IncomingEmailEvent_createdAt_idx" ON "IncomingEmailEvent"("createdAt");

-- CreateIndex
CREATE INDEX "IncomingEmailEvent_eventType_idx" ON "IncomingEmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "IncomingEmailEvent_emailLower_idx" ON "IncomingEmailEvent"("emailLower");

-- CreateIndex
CREATE INDEX "IncomingEmailEvent_messageId_idx" ON "IncomingEmailEvent"("messageId");
