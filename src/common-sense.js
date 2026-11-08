// Common Sense AI — core namespace and version.
// Every src file attaches to the same `CommonSense` object, in the browser
// (as a global) and in Node (via module.exports), with no dependencies.
(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  CS.VERSION = '0.1.0';

  // Optional LLM adapter (see src/adapters/llm.js). Null means the
  // rule-based interpreter runs on its own.
  var _adapter = null;

  // Register an adapter object with a `complete(prompt, context)` function.
  // Returns the adapter. Throws if the shape is wrong.
  CS.setAdapter = function (adapter) {
    if (!adapter || typeof adapter.complete !== 'function') {
      throw new Error('Adapter must provide a complete(prompt, context) function.');
    }
    _adapter = adapter;
    return adapter;
  };

  CS.getAdapter = function () { return _adapter; };
})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
