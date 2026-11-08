// Context profile: everything the layer remembers about you.
// Every assumption the interpreter makes comes from here — never from nowhere.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var STORAGE_KEY = 'csai-profile';

  // The default profile used by the demo. A fictional persona — edit it in
  // the demo to make it yours.
  CS.defaultProfile = function () {
    return {
      name: 'Alex',
      timezone: 'America/Chicago',
      interests: ['Chicago Bears', 'Home cooking'],
      projects: ['Weekend Bakery', 'Neighborhood Running Club'],
      people: { Sam: 'friend' },
      preferences: {
        defaultPlatform: 'X',
        tone: 'funny',
        postLength: 'short'
      },
      routines: ['post Bears content during the day'],
      facts: [] // learned corrections, newest first
    };
  };

  // Load the saved profile (browser localStorage) or the default.
  CS.loadProfile = function () {
    try {
      if (typeof localStorage === 'undefined') return CS.defaultProfile();
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return CS.defaultProfile();
      var saved = JSON.parse(raw);
      var base = CS.defaultProfile();
      return Object.assign(base, saved, {
        preferences: Object.assign(base.preferences, saved.preferences || {}),
        people: Object.assign(base.people, saved.people || {})
      });
    } catch (e) {
      return CS.defaultProfile();
    }
  };

  // Save the profile. No-op outside a browser.
  CS.saveProfile = function (profile) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (e) { /* storage unavailable — profile stays in memory */ }
    return profile;
  };

  // Forget the saved profile and return the default.
  CS.resetProfile = function () {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    return CS.defaultProfile();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
