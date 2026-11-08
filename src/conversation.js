(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var MAX_TURNS = 10;
  var _history = [];

  CS.addTurn = function (instruction, result) {
    _history.unshift({ instruction: instruction, result: result, at: Date.now() });
    if (_history.length > MAX_TURNS) _history.pop();
  };

  CS.getHistory = function () { return _history.slice(); };
  CS.clearHistory = function () { _history = []; };

  CS.resolveFromHistory = function (slot) {
    for (var i = 0; i < _history.length; i++) {
      var turn = _history[i];
      if (turn.result && turn.result.slots && turn.result.slots[slot]) {
        return turn.result.slots[slot];
      }
    }
    return null;
  };

  CS.enrichFromHistory = function (result) {
    if (!_history.length) return result;
    var VAGUE = /^(the )?(thing|it|that|this|them|those|same)$/i;
    var slots = result.slots;
    var assumptions = result.assumptions.slice();
    var RESOLVABLE = ['topic', 'task', 'event', 'item', 'content', 'query'];
    RESOLVABLE.forEach(function (slot) {
      var val = slots[slot];
      if (!val || VAGUE.test(val)) {
        var resolved = CS.resolveFromHistory(slot);
        if (resolved) {
          slots[slot] = resolved;
          assumptions.push({ slot: slot, value: resolved, source: 'history (last mention)' });
        }
      }
    });
    var missing = (CS._getRequiredSlots ? CS._getRequiredSlots(result.intent) : [])
      .filter(function (s) { return !slots[s]; });
    var confidence = missing.length ? 'low' : (assumptions.length ? 'medium' : 'high');
    var question = confidence === 'low'
      ? CS.clarify({ intent: result.intent, slots: slots, missing: missing })
      : null;
    return Object.assign({}, result, { slots: slots, assumptions: assumptions, confidence: confidence, question: question });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
