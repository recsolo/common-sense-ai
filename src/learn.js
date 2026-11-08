// Learner: applies corrections back into the profile, so the same question
// is never asked twice. A correction is a fact — store it.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  // correction: { type, key, value }
  //   type 'fact'       -> profile.facts.unshift({ key, value, at })
  //   type 'preference' -> profile.preferences[key] = value
  //   type 'interest'   -> profile.interests.push(value)
  //   type 'person'     -> profile.people[key] = value
  // Returns { profile, note }.
  CS.learn = function (profile, correction) {
    profile = profile || CS.defaultProfile();
    if (!correction || !correction.type) return { profile: profile, note: 'Nothing to learn from that.' };
    var note = '';

    if (correction.type === 'fact') {
      profile.facts = profile.facts || [];
      profile.facts.unshift({
        key: correction.key, value: correction.value, at: new Date().toISOString()
      });
      note = 'Got it — I\'ll remember that ' + correction.key + ' is ' + correction.value + '.';
    } else if (correction.type === 'preference') {
      profile.preferences = profile.preferences || {};
      profile.preferences[correction.key] = correction.value;
      note = 'Got it — I\'ll use ' + correction.value + ' for ' + correction.key + ' from now on.';
    } else if (correction.type === 'interest') {
      profile.interests = profile.interests || [];
      if (profile.interests.indexOf(correction.value) === -1) profile.interests.push(correction.value);
      note = 'Got it — added ' + correction.value + ' to your interests.';
    } else if (correction.type === 'person') {
      profile.people = profile.people || {};
      profile.people[correction.key] = correction.value;
      note = 'Got it — I\'ll remember ' + correction.key + ' is ' + correction.value + '.';
    }

    CS.saveProfile(profile);
    return { profile: profile, note: note };
  };

  // Learn from an answer to a clarifying question.
  // slot is the missing slot the question was about (e.g. 'topic', 'time').
  // Maps each slot to the right kind of learning: a platform answer becomes
  // a preference, a topic becomes an interest, a person is stored as a
  // contact (name:role), and anything else is stored as a fact.
  CS.learnFromAnswer = function (profile, slot, answer) {
    if (!answer) return { profile: profile, note: '' };
    var MAP = {
      platform: function (v) { return { type: 'preference', key: 'defaultPlatform', value: v }; },
      topic: function (v) { return { type: 'interest', value: v }; },
      person: function (v) {
        var p = v.split(':');
        return { type: 'person', key: p[0].trim(), value: (p[1] || 'contact').trim() };
      }
    };
    var builder = MAP[slot];
    return CS.learn(profile, builder ? builder(answer) : { type: 'fact', key: slot, value: answer });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
