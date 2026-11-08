// Interpreter: turns a vague instruction into intent + slots, records every
// assumption with its source, and scores confidence honestly.
// Rule-based on purpose: small enough to read in one sitting.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var TIME_WORDS = /\b(tomorrow|tonight|today|this (morning|afternoon|evening)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at \d{1,2}(:\d{2})?\s*(am|pm)?|\d{1,2}\s*(am|pm))\b/i;
  var PLATFORMS = ['x', 'twitter', 'instagram', 'facebook', 'pinterest', 'tiktok'];
  var GENERIC_WORDS = /^(the )?(thing|it|that|stuff|something)$/i;

  // intent: keyword pattern, required slots, action template.
  // Order matters: first match wins.
  var INTENTS = [
    {
      name: 'post',
      pattern: /\b(post|tweet|share|publish)\b/i,
      required: ['topic', 'platform'],
      action: function (s) {
        return 'Draft ' + (s.tone ? s.tone + ' ' : '') + (s.topic || 'posts') +
          ' posts for ' + (s.platform || 'X') + ', spaced through ' + (s.time || 'today') + '.';
      }
    },
    {
      name: 'message',
      pattern: /\b(text|message|dm|email|tell)\b/i,
      required: ['person', 'content'],
      action: function (s) {
        return 'Send a message to ' + (s.person || 'someone') +
          (s.content ? ': "' + s.content + '"' : '.');
      }
    },
    {
      name: 'remind',
      pattern: /\b(remind|remember)\b/i,
      required: ['task', 'time'],
      action: function (s) {
        return 'Remind me to ' + (s.task || 'do the thing') + ' ' + (s.time || '') + '.';
      }
    },
    {
      name: 'schedule',
      pattern: /\b(schedule|book|plan|meeting)\b/i,
      required: ['event', 'time'],
      action: function (s) {
        return 'Schedule ' + (s.event || 'the event') + ' for ' + (s.time || 'some time') + '.';
      }
    },
    {
      name: 'buy',
      pattern: /\b(buy|order|purchase|get|grab|pick up)\b/i,
      required: ['item'],
      action: function (s) { return 'Buy ' + (s.item || 'it') + '.'; }
    },
    {
      name: 'note',
      pattern: /\b(note|write down|save|jot)\b/i,
      required: ['content'],
      action: function (s) { return 'Save a note: ' + (s.content || '') + '.'; }
    },
    {
      name: 'search',
      pattern: /\b(find|search|look up|check|what\'s|what is|how)\b/i,
      required: ['query'],
      action: function (s) { return 'Look up: ' + (s.query || '') + '.'; }
    }
  ];

  function findTime(text) {
    var m = text.match(TIME_WORDS);
    return m ? m[0].toLowerCase() : null;
  }

  // Match a profile topic (interest or project) mentioned by name or by any
  // distinctive word in it, e.g. "bears" matches "Chicago Bears".
  function findTopic(text, profile) {
    var lower = text.toLowerCase();
    var topics = (profile.interests || []).concat(profile.projects || []);
    for (var i = 0; i < topics.length; i++) {
      var topic = topics[i];
      if (lower.indexOf(topic.toLowerCase()) !== -1) return topic;
      var words = topic.split(/\s+/);
      for (var j = 0; j < words.length; j++) {
        if (words[j].length > 3 && lower.indexOf(words[j].toLowerCase()) !== -1) return topic;
      }
    }
    return null;
  }

  function findPerson(text, profile) {
    var lower = text.toLowerCase();
    var names = Object.keys(profile.people || {});
    for (var i = 0; i < names.length; i++) {
      if (lower.indexOf(names[i].toLowerCase()) !== -1) return names[i];
    }
    return null;
  }

  function findPlatform(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < PLATFORMS.length; i++) {
      if (lower.indexOf(PLATFORMS[i]) !== -1) return PLATFORMS[i] === 'twitter' ? 'X' : PLATFORMS[i];
    }
    return null;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function stripWords(text, words) {
    var out = text;
    words.forEach(function (w) {
      if (!w) return;
      out = out.replace(new RegExp('\\b' + escapeRegex(w) + '\\b', 'gi'), ' ');
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  // Interpret a vague instruction against a profile.
  // Returns { intent, topic, slots, assumptions, confidence, question, action }.
  CS.interpret = function (instruction, profile) {
    profile = profile || CS.defaultProfile();
    var text = (instruction || '').trim();
    var slots = {};
    var assumptions = [];
    var intent = null;

    for (var i = 0; i < INTENTS.length; i++) {
      if (INTENTS[i].pattern.test(text)) { intent = INTENTS[i]; break; }
    }

    if (!intent) {
      return {
        intent: 'unknown', topic: null, slots: slots, assumptions: assumptions,
        confidence: 'low', question: null,
        action: 'Not sure what you mean yet. This looks like a follow-up to something ' +
          'earlier — the prototype does not track conversation yet (see roadmap).'
      };
    }

    var time = findTime(text);
    if (time) slots.time = time;

    var topic = findTopic(text, profile);
    if (topic) {
      slots.topic = topic;
    } else if (intent.name === 'post') {
      // A post with no topic: fall back to the first interest, and say so.
      var first = (profile.interests || [])[0];
      if (first) {
        slots.topic = first;
        assumptions.push({ slot: 'topic', value: first, source: 'interest (first)' });
      }
    }

    var person = findPerson(text, profile);
    if (person) slots.person = person;

    var platform = findPlatform(text);
    if (platform) {
      slots.platform = platform;
    } else if (intent.name === 'post' || intent.name === 'message') {
      var def = profile.preferences && profile.preferences.defaultPlatform;
      if (def) {
        slots.platform = def;
        assumptions.push({ slot: 'platform', value: def, source: 'preference:defaultPlatform' });
      }
    }

    if (intent.name === 'post') {
      slots.tone = (profile.preferences && profile.preferences.tone) || null;
      if (!slots.time && (profile.routines || []).length) {
        slots.time = 'today';
        assumptions.push({ slot: 'time', value: 'today', source: 'routine' });
      }
    }

    if (intent.name === 'remind') {
      var task = stripWords(text, ['remind', 'me', 'about', 'to', time || '~~nomatch~~']);
      slots.task = (!task || GENERIC_WORDS.test(task)) ? null : task;
    }

    if (intent.name === 'message') {
      var content = stripWords(text, ['text', 'message', 'dm', 'email', 'tell', person || '~~nomatch~~']);
      slots.content = content || null;
    }

    if (intent.name === 'schedule') {
      var event = stripWords(text, ['schedule', 'book', 'plan', 'meeting', 'the', 'for', time || '~~nomatch~~']);
      slots.event = (!event || GENERIC_WORDS.test(event)) ? null : event;
    }

    if (intent.name === 'buy') {
      var item = stripWords(text, ['buy', 'order', 'purchase', 'get', 'grab', 'pick up', 'some', 'a', 'an']);
      slots.item = item || null;
    }

    if (intent.name === 'note') {
      var note = stripWords(text, ['note', 'write down', 'save', 'jot', 'that']);
      slots.content = note || null;
    }

    if (intent.name === 'search') {
      slots.query = text;
    }

    var missing = intent.required.filter(function (slot) { return !slots[slot]; });
    var confidence = missing.length ? 'low' : (assumptions.length ? 'medium' : 'high');
    var question = confidence === 'low' ? CS.clarify({ intent: intent.name, slots: slots, missing: missing }) : null;

    return {
      intent: intent.name,
      topic: slots.topic || null,
      slots: slots,
      assumptions: assumptions,
      confidence: confidence,
      question: question,
      action: intent.action(slots)
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
