#!/usr/bin/env node
'use strict';

const { Server }               = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

require('./src/common-sense.js');
require('./src/context.js');
require('./src/storage.js');
require('./src/clarify.js');
require('./src/interpret.js');
require('./src/learn.js');
require('./src/adapters/llm.js');
require('./src/conversation.js');
require('./src/calibrate.js');
require('./src/providers.js');

const CS = globalThis.CommonSense;

const TOOLS = [
  {
    name: 'interpret_instruction',
    description: 'Interprets a vague instruction using the saved user profile. Returns intent, slots, assumptions, confidence, and a clarifying question when confidence is low.',
    inputSchema: {
      type: 'object',
      properties: { instruction: { type: 'string' } },
      required: ['instruction']
    }
  },
  {
    name: 'clarify_slot',
    description: 'Returns the single best clarifying question for a low-confidence result, ranked by cost-of-being-wrong.',
    inputSchema: {
      type: 'object',
      properties: {
        interpret_result: {
          type: 'object',
          properties: {
            intent:  { type: 'string' },
            slots:   { type: 'object' },
            missing: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['interpret_result']
    }
  },
  {
    name: 'learn_from_answer',
    description: 'Saves a user answer into the persistent profile so the same slot is never asked again.',
    inputSchema: {
      type: 'object',
      properties: {
        slot:   { type: 'string' },
        answer: { type: 'string' }
      },
      required: ['slot', 'answer']
    }
  },
  {
    name: 'get_profile',
    description: 'Returns the current user profile from ~/.common-sense-ai/profile.json.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'update_profile',
    description: 'Updates fields in the user profile. Accepts: name, timezone, interests, projects, people, preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        name:      { type: 'string' },
        timezone:  { type: 'string' },
        interests: { type: 'array', items: { type: 'string' } },
        projects:  { type: 'array', items: { type: 'string' } },
        people:    { type: 'object', additionalProperties: { type: 'string' } },
        preferences: {
          type: 'object',
          properties: {
            defaultPlatform: { type: 'string' },
            tone:            { type: 'string' },
            postLength:      { type: 'string', enum: ['short','medium','long'] }
          }
        }
      }
    }
  },
  {
    name: 'add_turn',
    description: 'Records a turn into conversation history for pronoun resolution.',
    inputSchema: {
      type: 'object',
      properties: {
        instruction:      { type: 'string' },
        interpret_result: { type: 'object' }
      },
      required: ['instruction', 'interpret_result']
    }
  },
  {
    name: 'get_history',
    description: 'Returns the last N turns of conversation history.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } }
    }
  },
  {
    name: 'reset_profile',
    description: 'Deletes the saved profile and starts fresh.',
    inputSchema: { type: 'object', properties: {} }
  }
];

function handleTool(name, args) {
  switch (name) {
    case 'interpret_instruction': {
      var profile = CS.loadProfile();
      var raw = CS.interpret(args.instruction, profile);
      var result = CS.enrichFromHistory(raw);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    case 'clarify_slot': {
      var q = CS.clarify(args.interpret_result);
      return { content: [{ type: 'text', text: JSON.stringify({ question: q }) }] };
    }
    case 'learn_from_answer': {
      var profile = CS.loadProfile();
      var lr = CS.learnFromAnswer(profile, args.slot, args.answer);
      CS.saveProfile(lr.profile);
      return { content: [{ type: 'text', text: JSON.stringify({ saved: true, note: lr.note }) }] };
    }
    case 'get_profile':
      return { content: [{ type: 'text', text: JSON.stringify(CS.loadProfile(), null, 2) }] };
    case 'update_profile': {
      var profile = CS.loadProfile();
      ['name','timezone'].forEach(function(k) {
        if (typeof args[k] === 'string') profile[k] = args[k];
      });
      ['interests','projects'].forEach(function(k) {
        if (Array.isArray(args[k])) {
          args[k].forEach(function(v) { if (!profile[k].includes(v)) profile[k].push(v); });
        }
      });
      if (args.people) Object.assign(profile.people, args.people);
      if (args.preferences) Object.assign(profile.preferences, args.preferences);
      CS.saveProfile(profile);
      return { content: [{ type: 'text', text: JSON.stringify({ saved: true, profile: profile }) }] };
    }
    case 'add_turn':
      CS.addTurn(args.instruction, args.interpret_result);
      return { content: [{ type: 'text', text: JSON.stringify({ added: true }) }] };
    case 'get_history': {
      var limit = (args.limit && args.limit > 0) ? args.limit : 5;
      return { content: [{ type: 'text', text: JSON.stringify(CS.getHistory().slice(0, limit), null, 2) }] };
    }
    case 'reset_profile':
      CS.resetProfile();
      return { content: [{ type: 'text', text: JSON.stringify({ reset: true }) }] };
    default:
      throw new Error('Unknown tool: ' + name);
  }
}

async function main() {
  const server = new Server(
    { name: 'common-sense-ai', version: '0.3.0' },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return handleTool(name, args || {});
    } catch (err) {
      return { content: [{ type: 'text', text: 'Error: ' + err.message }], isError: true };
    }
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(function(err) {
  process.stderr.write('common-sense-ai MCP error: ' + err.message + '\n');
  process.exit(1);
});
