// LLM adapter interface: how to plug a real model into the layer.
// The layer's job is the loop (interpret -> assume -> clarify -> learn).
// The model's job is only the guessing part. Without an adapter, the
// rule-based interpreter in src/interpret.js runs instead.
//
// An adapter is any object with:
//   adapter.complete(prompt, context) -> Promise<string>
//
// Example — wrap any model client:
//
//   const adapter = CommonSense.createLLMAdapter(async (prompt, context) => {
//     const res = await fetch('https://your-model-endpoint', {
//       method: 'POST',
//       body: JSON.stringify({ prompt, context })
//     });
//     const data = await res.json();
//     return data.text;
//   });
//   CommonSense.setAdapter(adapter);
//
// Rules for adapters:
// - They receive the user's words plus the profile as `context`. They must
//   not receive anything the user hasn't opted in to share.
// - They return plain text (or JSON the caller parses). They never act
//   directly — the layer decides what happens with the result.
// - No adapter is configured by default. The demo runs with no keys.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  // Validate and wrap a complete() function into an adapter object.
  CS.createLLMAdapter = function (completeFn) {
    if (typeof completeFn !== 'function') {
      throw new Error('createLLMAdapter needs a function: (prompt, context) => Promise<string>.');
    }
    return { complete: completeFn };
  };

  // Ask the configured adapter. Rejects clearly when none is set.
  CS.completeWithAdapter = function (prompt, context) {
    var adapter = CS.getAdapter ? CS.getAdapter() : null;
    if (!adapter) {
      return Promise.reject(new Error(
        'No LLM adapter configured. Call CommonSense.setAdapter(...) first, ' +
        'or use the rule-based interpreter (no model needed).'
      ));
    }
    return Promise.resolve(adapter.complete(prompt, context || {}));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
