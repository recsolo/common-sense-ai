// Tests for the Common Sense AI core. Run: node --test tests/interpret.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const requireSrc = createRequire(import.meta.url);

requireSrc('../src/common-sense.js');
requireSrc('../src/context.js');
requireSrc('../src/clarify.js');
requireSrc('../src/interpret.js');
requireSrc('../src/learn.js');
requireSrc('../src/adapters/llm.js');

const CS = globalThis.CommonSense;

test('post bears content: intent, topic and platform from context', () => {
  const r = CS.interpret('post bears content', CS.defaultProfile());
  assert.equal(r.intent, 'post');
  assert.equal(r.topic, 'Chicago Bears');
  assert.equal(r.slots.platform, 'X');
  assert.equal(r.confidence, 'medium'); // platform + time assumed
  assert.equal(r.question, null);
  assert.ok(r.assumptions.some((a) => a.slot === 'platform' && a.source === 'preference:defaultPlatform'));
});

test('remind me about the thing tomorrow: low confidence, one question', () => {
  const r = CS.interpret('remind me about the thing tomorrow', CS.defaultProfile());
  assert.equal(r.intent, 'remind');
  assert.equal(r.slots.time, 'tomorrow');
  assert.equal(r.confidence, 'low');
  assert.equal(r.question, 'Which thing should I remind you about?');
});

test('text sam: person known, content missing, personal question', () => {
  const r = CS.interpret('text sam', CS.defaultProfile());
  assert.equal(r.intent, 'message');
  assert.equal(r.slots.person, 'Sam');
  assert.equal(r.confidence, 'low');
  assert.equal(r.question, 'What should I tell Sam?');
});

test('get milk: everything stated, high confidence', () => {
  const r = CS.interpret('get milk', CS.defaultProfile());
  assert.equal(r.intent, 'buy');
  assert.equal(r.slots.item, 'milk');
  assert.equal(r.confidence, 'high');
  assert.equal(r.question, null);
  assert.deepEqual(r.assumptions, []);
});

test('schedule the thing for Friday: event missing', () => {
  const r = CS.interpret('schedule the thing for Friday', CS.defaultProfile());
  assert.equal(r.intent, 'schedule');
  assert.equal(r.slots.time, 'friday');
  assert.equal(r.confidence, 'low');
  assert.equal(r.question, "What's the event?");
});

test('learn: an answered question becomes a stored fact', () => {
  const profile = CS.defaultProfile();
  const out = CS.learnFromAnswer(profile, 'task', 'call the plumber');
  assert.equal(out.profile.facts[0].key, 'task');
  assert.equal(out.profile.facts[0].value, 'call the plumber');
  assert.match(out.note, /remember/);
});

test('learn: a preference change sticks', () => {
  const profile = CS.defaultProfile();
  const out = CS.learn(profile, { type: 'preference', key: 'tone', value: 'warm' });
  assert.equal(out.profile.preferences.tone, 'warm');
});

test('quickAnswers: topic question suggests interests', () => {
  const answers = CS.quickAnswers('What should it be about?', CS.defaultProfile());
  assert.ok(answers.includes('Chicago Bears'));
});

test('llm adapter: rejects clearly when none is configured', async () => {
  await assert.rejects(CS.completeWithAdapter('hello'), /No LLM adapter configured/);
  const adapter = CS.createLLMAdapter(async () => 'hi');
  CS.setAdapter(adapter);
  assert.equal(await CS.completeWithAdapter('hello'), 'hi');
});
