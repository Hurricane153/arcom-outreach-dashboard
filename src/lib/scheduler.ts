import { prisma } from "./prisma";
import { triggerRun } from "./control";

// In-process autopilot loop. Runs inside the long-lived Next.js server process
// (started from instrumentation.ts). Checks once a minute whether an autopilot
// run is due, and if so fires the main workflow webhook.

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  const TICK_MS = 60 * 1000;

  const tick = async () => {
    try {
      const cfg = await prisma.autopilotConfig.findUnique({
        where: { id: "default" },
      });
      if (!cfg || !cfg.enabled) return;

      const intervalMs = cfg.intervalMinutes * 60 * 1000;
      const last = cfg.lastRunAt ? new Date(cfg.lastRunAt).getTime() : 0;
      const due = Date.now() - last >= intervalMs;
      if (!due) return;

      // Claim the slot first so a slow trigger can't double-fire next tick.
      const now = new Date();
      await prisma.autopilotConfig.update({
        where: { id: "default" },
        data: {
          lastRunAt: now,
          nextRunAt: new Date(now.getTime() + intervalMs),
        },
      });

      await triggerRun({
        count: cfg.leadsPerRun,
        brief: cfg.brief ?? undefined,
        chatId: cfg.chatId ?? undefined,
        source: "autopilot",
      });
    } catch {
      // Never let the loop die on a transient error.
    }
  };

  // Run shortly after boot, then every minute.
  setTimeout(tick, 10 * 1000);
  setInterval(tick, TICK_MS);
  console.log("[autopilot] scheduler started");
}
