/**
 * Cloudflare Worker to ping Supabase and keep it from pausing on the free tier.
 * Triggered daily via Cron.
 */

export interface Env {
  SUPABASE_URL: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log("Cron triggered, pinging Supabase...");
    
    if (!env.SUPABASE_URL) {
      console.error("SUPABASE_URL environment variable is missing.");
      return;
    }

    try {
      // Just hit the REST endpoint root, it's enough to wake up / keep alive the DB
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
        method: "GET",
      });

      if (response.ok) {
        console.log("Successfully pinged Supabase:", response.status);
      } else {
        console.error("Failed to ping Supabase:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error pinging Supabase:", error);
    }
  },
};
