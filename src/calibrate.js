(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var RELIABILITY_THRESHOLD = 0.6;
  var MIN_SAMPLES = 3;

  CS.recordAssumptionResult = function (profile, source, wasCorrect) {
    profile.calibration = profile.calibration || {};
    profile.calibration[source] = profile.calibration[source] || { hits: 0, misses: 0 };
    if (wasCorrect) { profile.calibration[source].hits++; }
    else            { profile.calibration[source].misses++; }
    CS.saveProfile(profile);
    return profile;
  };

  CS.isSourceReliable = function (profile, source) {
    var cal = profile.calibration && profile.calibration[source];
    if (!cal) return true;
    var total = cal.hits + cal.misses;
    if (total < MIN_SAMPLES) return true;
    return (cal.hits / total) >= RELIABILITY_THRESHOLD;
  };

  CS.splitAssumptionsByReliability = function (profile, assumptions) {
    var reliable = [], unreliable = [];
    assumptions.forEach(function (a) {
      if (CS.isSourceReliable(profile, a.source)) { reliable.push(a); }
      else { unreliable.push(Object.assign({}, a, { unreliable: true })); }
    });
    return { reliable: reliable, unreliable: unreliable };
  };

  CS.calibratedConfidence = function (profile, missing, assumptions) {
    if (missing.length) return 'low';
    if (!assumptions.length) return 'high';
    var split = CS.splitAssumptionsByReliability(profile, assumptions);
    if (split.unreliable.length) return 'low';
    return 'medium';
  };

  CS.recordCorrectionMiss = function (profile, slot, assumptions) {
    assumptions.forEach(function (a) {
      if (a.slot === slot) CS.recordAssumptionResult(profile, a.source, false);
    });
  };

  CS.recordConfirmationHits = function (profile, assumptions) {
    assumptions.forEach(function (a) { CS.recordAssumptionResult(profile, a.source, true); });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
