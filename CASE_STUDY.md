# mydailyroutine.app — Case Study

**Problem:** Most productivity apps make you schedule tasks manually. Users still had to figure out what to schedule and when — the planning work was entirely on them.

**Solution:** Built a SaaS product where users chat with an AI to build their entire weekly routine. The AI updates a live 7-day timeline in real time. Added goal tracking with subtasks and priorities, streak stats, completion heatmaps, and a Paddle-powered premium tier.

**Technical decisions worth noting:** Dual auth (NextAuth for Google, custom JWT for email/password), Zod validation at every Server Action boundary, HMAC-SHA256 webhook verification for Paddle, Redis-ready architecture, S3 photo storage, and deployment on a self-managed Coolify VPS.

**Result:** Shipped solo — architecture, development, deployment, and client communication all independent. Currently serving 5 active users in production.
