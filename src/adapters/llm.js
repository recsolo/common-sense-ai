(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  CS.createLLMAdapter = function (completeFn) {
    if (typeof completeFn !== 'function') {
      throw new Error('createLLMAdapter needs a function: (prompt, context) => Promise<string>.');
    }
    return { complete: completeFn };
  };

  CS.completeWithAdapter = function (prompt, context) {
    var adapter = CS.getAdapter ? CS.getAdapter() : null;
    if (!adapter) return Promise.reject(new Error('No LLM adapter configured.'));
    var fullContext = Object.assign({ profile: CS.loadProfile ? CS.loadProfile() : {} }, context || {});
    return Promise.resolve(adapter.complete(prompt, fullContext));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
