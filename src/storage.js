(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  function profilePath() {
    var dir = process.env.CSAI_PROFILE_DIR ||
              require('path').join(require('os').homedir(), '.common-sense-ai');
    return require('path').join(dir, 'profile.json');
  }

  function ensureDir(filePath) {
    var dir = require('path').dirname(filePath);
    var fs = require('fs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  function coerceArray(val, fallback) {
    return Array.isArray(val) ? val : (fallback || []);
  }
  function coerceObject(val, fallback) {
    return (val && typeof val === 'object' && !Array.isArray(val)) ? val : (fallback || {});
  }

  CS.loadProfile = function () {
    try {
      var fp = profilePath();
      var fs = require('fs');
      if (!fs.existsSync(fp)) return CS.defaultProfile();
      var saved = JSON.parse(fs.readFileSync(fp, 'utf8'));
      var base = CS.defaultProfile();
      return {
        name:        typeof saved.name === 'string' ? saved.name : base.name,
        timezone:    typeof saved.timezone === 'string' ? saved.timezone : base.timezone,
        interests:   coerceArray(saved.interests,   base.interests),
        projects:    coerceArray(saved.projects,    base.projects),
        people:      coerceObject(saved.people,     base.people),
        preferences: Object.assign({}, base.preferences, coerceObject(saved.preferences, {})),
        routines:    coerceArray(saved.routines,    base.routines),
        facts:       coerceArray(saved.facts,       base.facts),
        calibration: coerceObject(saved.calibration, base.calibration)
      };
    } catch (e) {
      return CS.defaultProfile();
    }
  };

  CS.saveProfile = function (profile) {
    try {
      var fp = profilePath();
      ensureDir(fp);
      require('fs').writeFileSync(fp, JSON.stringify(profile, null, 2), 'utf8');
    } catch (e) {}
    return profile;
  };

  CS.resetProfile = function () {
    try {
      var fp = profilePath();
      var fs = require('fs');
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch (e) {}
    return CS.defaultProfile();
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
