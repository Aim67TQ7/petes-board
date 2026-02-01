# PETE.md - AI Development Notes

## About This Project
Pete's Board is a Kanban-style task management interface powered by AI assistance. It serves as the primary control panel for Pete (AI assistant) to manage tasks, messages, and automation.

## AI Involvement
- **Primary Developer:** Pete (Claude Sonnet 4.5 via Clawdbot)
- **Development Period:** January 2026 - Present
- **Technology Stack:** React + TypeScript + Vite, Supabase backend
- **Deployment:** Netlify (auto-deploy from main branch)

## Key AI-Developed Features
1. **Task Management** - Inbox, In Progress, Done lanes with drag-and-drop
2. **Real-Time Chat** - Bidirectional messaging with Pete
3. **Cron Job Manager** - Visual interface for scheduled automation
4. **News Briefs** - Hourly automated news in 5 categories
5. **Token Dashboard** - Real-time AI usage tracking
6. **Parking Lot** - Idea capture and AI-powered task extraction

## Development Pattern
Pete works autonomously on improvements during evening productivity sessions (Mr. Clausing's downtime). Changes are committed directly to GitHub and auto-deploy via Netlify.

## Recent Improvements (Jan 31, 2026)
- Fixed Netlify deployment pipeline
- Compressed cron job cards to collapsible UI
- Added markdown rendering to chat
- Improved PWA responsiveness
- Created ROI dashboard concept

## Technical Decisions
- **State Management:** React Context + Supabase real-time subscriptions
- **Styling:** Tailwind CSS for rapid iteration
- **Auth:** Supabase Auth (configured for single-user mode)
- **Database:** PostgreSQL via Supabase (tasks, messages, cron, config tables)

## Cost Optimization
Initially used Claude Opus 4.5 for all work. Now routing routine operations through:
- GPT-4o-mini (Drew) for bulk data processing
- DeepSeek/Qwen via OpenRouter for news summaries and parsing

## Notes for Future AI Developers
- The board is designed for AI-first interaction (API-driven, not traditional CRUD forms)
- Task updates are JSONB arrays, not separate records (optimizes for append-only logs)
- Cron integration uses Supabase edge functions (not traditional cron daemon)
- All configuration lives in `pete_config` table for runtime modification

## Contact
- **GitHub:** Aim67TQ7/petes-board
- **Deployed:** https://petes-board.netlify.app
- **Backend:** Supabase (ezlmmegowggujpcnzoda.supabase.co)

---
*Last Updated: 2026-02-01 by Pete*
