# Agent Girl

A desktop-first chat interface for Claude Agent SDK with real-time streaming, persistent sessions, and specialized sub-agents, running locally with full file system access. Built with Bun, React 19, and TypeScript.

## Tech Stack

- **Runtime:** Bun
- **Backend:** Bun HTTP + WebSocket server (port 3001)
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Radix UI
- **State:** Zustand, localStorage
- **Database:** SQLite (session persistence)
- **AI:** Claude Agent SDK, multi-provider (Anthropic, Z.AI, Moonshot)
- **Testing:** Bun test runner, @testing-library/react

## Project Structure

```
server/
├── server.ts              # Main entry point (port 3001)
├── agents.ts              # Agent configuration
├── database.ts            # SQLite session management
├── providers.ts           # AI provider integration (Anthropic, Z.AI, Moonshot)
├── mcpServers.ts          # MCP server setup
├── systemPrompt.ts        # System prompt construction
├── sessionStreamManager.ts # Real-time streaming
├── routes/                # API endpoints (sessions, commands, directory, userConfig)
├── commands/              # Slash commands per mode (shared, coder, spark, etc.)
├── modes/                 # System prompt text files per mode
├── templates/             # CLAUDE.md templates per mode
├── mcp/                   # MCP tools (askUserQuestion)
├── websocket/             # WebSocket message handlers
└── utils/                 # Utilities (apiErrors, AsyncQueue, retry, timeout)

client/
├── App.tsx                # Main React component
├── index.tsx              # Entry point
├── config/
│   └── models.ts          # Model definitions (single source of truth)
├── components/
│   ├── chat/              # ChatContainer, ChatInput, MessageList, ModeSelector
│   ├── message/           # AssistantMessage, UserMessage, ThinkingBlock, CodeBlock
│   ├── header/            # ModelSelector, PermissionModeToggle, RadioPlayer
│   ├── sidebar/           # Navigation sidebar
│   ├── ui/                # Base Radix UI primitives
│   ├── build-wizard/      # Build/setup wizard
│   ├── plan/              # Planning view
│   ├── process/           # Process visualization
│   └── question/          # Interactive question prompts
├── hooks/                 # useWebSocket, useSessionAPI
├── utils/                 # errorMessages, syntaxHighlighter, toast, urlFormatter
└── lib/                   # Shared utility functions

data/                      # SQLite session database
dist/                      # Build output (CSS + bundled JS)
```

## Modes

Four operational modes with dedicated prompts, commands, and templates:
- **general** — Standard conversation
- **coder** — Programming-focused
- **spark** — Brainstorming
- **intense-research** — Deep research

## Organization Rules

**Modularity principles:**
- API routes → `/server/routes`, one file per resource
- React components → `/client/components`, one component per file
- Slash commands → `/server/commands/[mode]`, one command per .md file
- Utilities → grouped by domain (server/utils, client/utils)
- Tests → co-located with code being tested
- Model config → `client/config/models.ts` (single source of truth)

**Single responsibility:**
- Keep files focused and under 300 lines
- Extract shared logic to utilities
- Mode-specific features stay in mode folders

## Code Quality - Zero Tolerance

After editing ANY file, run ALL checks:

```bash
bunx tsc --noEmit
bunx eslint .
```

Fix ALL errors/warnings before continuing.

**Run tests:**
```bash
bun test
```

**Server restart (if needed):**
```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null; bun run dev
```

Read server output and fix ALL warnings/errors.
