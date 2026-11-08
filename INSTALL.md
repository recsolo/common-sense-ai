# common-sense-ai — Install Guide

An MCP server that gives any LLM tool common sense. Understands vague
instructions using your saved profile, makes smart assumptions, and asks
only the one question that matters most.

Profile saved to ~/.common-sense-ai/profile.json — shared across all tools.

## Install

    npm install

## Claude Code

    claude mcp add common-sense-ai -- node /path/to/mcp-server.js
    claude mcp list

## Cursor  (~/.cursor/mcp.json)

    {
      "mcpServers": {
        "common-sense-ai": {
          "command": "node",
          "args": ["/path/to/mcp-server.js"]
        }
      }
    }

## Windsurf  (~/.codeium/windsurf/mcp_config.json)

    {
      "mcpServers": {
        "common-sense-ai": {
          "command": "node",
          "args": ["/path/to/mcp-server.js"]
        }
      }
    }

## Continue / VS Code  (~/.continue/config.json)

    {
      "mcpServers": [{
        "name": "common-sense-ai",
        "command": "node",
        "args": ["/path/to/mcp-server.js"]
      }]
    }

## First-time setup

Tell your LLM once:
"Update my common-sense profile: name Mike, Central time,
 post to X and Instagram, interests are sports and Chicago Bears."

Done. It never asks again.

## Tools

| Tool | What it does |
|------|-------------|
| interpret_instruction | Reads profile, fills slots, returns intent + confidence |
| clarify_slot | Best clarifying question for missing info |
| learn_from_answer | Saves answer so it's never asked again |
| get_profile / update_profile / reset_profile | Manage your profile |
| add_turn / get_history | Multi-turn memory within a session |

## Env var

CSAI_PROFILE_DIR — override profile location (default: ~/.common-sense-ai)
