(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  CS.createOpenAIAdapter = function (openaiClient, options) {
    if (!openaiClient || typeof openaiClient.chat === 'undefined') {
      throw new Error('createOpenAIAdapter requires an OpenAI client instance.');
    }
    var model = (options && options.model) || 'gpt-4o-mini';
    return CS.createLLMAdapter(function (prompt, context) {
      return openaiClient.chat.completions.create({
        model: model,
        temperature: 0,
        max_tokens: 256,
        messages: [
          {
            role: 'system',
            content: 'Extract intent and slots from vague user instructions. Respond ONLY with valid JSON — no markdown, no explanation. If a slot cannot be inferred, set it to null.'
          },
          {
            role: 'user',
            content: prompt + '\n\nUser context: ' + JSON.stringify({
              interests: (context.profile && context.profile.interests) || [],
              projects:  (context.profile && context.profile.projects)  || [],
              people:    Object.keys((context.profile && context.profile.people) || {})
            })
          }
        ]
      }).then(function (res) {
        return res.choices[0].message.content || '{}';
      });
    });
  };

})(typeof globalThis !== 'undefined' ? globalThis : this);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = globalThis.CommonSense;
}
