// Clarifier: picks the SINGLE most important question when a critical slot
// is missing. One question at a time — never a form.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var QUESTIONS = {
    topic: 'What should it be about?',
    platform: 'Where should I post it?',
    person: 'Who should I send it to?',
    content: 'What should it say?',
    task: 'Which thing should I remind you about?',
    event: "What's the event?",
    time: 'When?',
    item: 'What should I get?',
    query: 'What should I look up?'
  };

  // result: { intent, slots, missing } from interpret().
  // Returns one question string, or null when nothing is missing.
  CS.clarify = function (result) {
    if (!result.missing || !result.missing.length) return null;
    var slot = result.missing[0];
    // A message with a known person gets a personal question.
    if (slot === 'content' && result.intent === 'message' && result.slots.person) {
      return 'What should I tell ' + result.slots.person + '?';
    }
    return QUESTIONS[slot] || 'Can you say a bit more about that?';
  };

  // Quick-answer suggestions for a question, drawn from the profile.
  // Returns an array (possibly empty).
  CS.quickAnswers = function (question, profile) {
    profile = profile || CS.defaultProfile();
    if (/about\?$/i.test(question)) return (profile.interests || []).slice();
    if (/send it to/i.test(question)) return Object.keys(profile.people || {});
    if (/post it/i.test(question)) return ['X', 'Instagram', 'Facebook'];
    if (/^When\?/.test(question)) return ['today', 'tomorrow', 'tonight'];
    return [];
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
