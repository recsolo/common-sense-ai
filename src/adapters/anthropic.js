(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  CS.createAnthropicAdapter = function (anthropicClient, options) {
    if (!anthropicClient || typeof anthropicClient.messages === 'undefined') {
      throw new Error('createAnthropicAdapter requires an Anthropic client instance.');
    }
    var model = (options && options.model) || 'claude-haiku-3-5';
    return CS.createLLMAdapter(function (prompt, context) {
      var ctx = JSON.stringify({
        interests: (context.profile && context.profile.interests) || [],
        projects:  (context.profile && context.profile.projects)  || [],
        people:    Object.keys((context.profile && context.profile.people) || {})
      });
      return anthropicClient.messages.create({
        model: model, max_tokens: 256,
        system: 'Extract intent and slots from vague user instructions. Respond ONLY with valid JSON.',
        messages: [{ role: 'user', content: prompt + '\n\nUser context: ' + ctx }]
      }).then(function (res) {
        var b = res.content && res.content[0];
        return (b && b.type === 'text' && b.text) || '{}';
      });
    });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);
if (typeof module !== 'undefined' && module.exports) module.exports = globalThis.CommonSense;
