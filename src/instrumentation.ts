// Next.js runs this once when the server process boots.
// We use it to start the in-process autopilot scheduler (Node runtime only).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
