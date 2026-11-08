// Demo wiring for Common Sense AI. No framework, no network.
(function () {
  var CS = window.CommonSense;
  var profile = CS.loadProfile();
  var lastResult = null;
  var lastInstruction = '';

  var EXAMPLES = [
    'post bears content',
    'remind me about the thing tomorrow',
    'text sam',
    'get milk',
    'schedule the thing for Friday',
    "what's the weather like tomorrow"
  ];

  function $(id) { return document.getElementById(id); }

  function renderProfile() {
    $('p-name').value = profile.name || '';
    $('p-interests').value = (profile.interests || []).join(', ');
    $('p-projects').value = (profile.projects || []).join(', ');
    $('p-people').value = Object.keys(profile.people || {})
      .map(function (n) { return n + ': ' + profile.people[n]; }).join('\n');
    $('p-platform').value = (profile.preferences || {}).defaultPlatform || 'X';
    $('p-tone').value = (profile.preferences || {}).tone || 'funny';
    $('p-routines').value = (profile.routines || []).join('\n');
    var facts = $('facts');
    facts.innerHTML = '';
    (profile.facts || []).slice(0, 8).forEach(function (f) {
      var li = document.createElement('li');
      li.textContent = f.key + ' → ' + f.value;
      facts.appendChild(li);
    });
    if (!(profile.facts || []).length) {
      var li = document.createElement('li');
      li.textContent = 'Nothing learned yet — answer a question and it shows up here.';
      facts.appendChild(li);
    }
  }

  function renderResult(result) {
    lastResult = result;
    $('result').classList.remove('hidden');
    $('r-intent').textContent = result.intent;
    var conf = $('r-conf');
    conf.textContent = result.confidence +
      (result.confidence === 'high' ? ' — everything was stated' :
       result.confidence === 'medium' ? ' — some of it was assumed' :
       ' — something critical is missing');
    $('r-action').textContent = result.action;
    var slots = Object.keys(result.slots)
      .filter(function (k) { return result.slots[k]; })
      .map(function (k) { return k + ': ' + result.slots[k]; });
    $('r-slots').textContent = slots.length ? slots.join(' · ') : 'none';
    $('r-assume').textContent = result.assumptions.length
      ? result.assumptions.map(function (a) {
          return a.slot + ' = ' + a.value + ' (' + a.source + ')';
        }).join(' · ')
      : 'none — everything was stated outright';
    var qbox = $('q-box');
    if (result.question) {
      qbox.classList.remove('hidden');
      $('r-question').textContent = result.question;
      $('learn-note').textContent = '';
      $('answer').value = '';
      var quick = $('quick');
      quick.innerHTML = '';
      CS.quickAnswers(result.question, profile).forEach(function (a) {
        var b = document.createElement('button');
        b.textContent = a;
        b.onclick = function () { $('answer').value = a; };
        quick.appendChild(b);
      });
    } else {
      qbox.classList.add('hidden');
    }
  }

  function understand() {
    var text = $('input').value.trim();
    if (!text) return;
    lastInstruction = text;
    renderResult(CS.interpret(text, profile));
  }

  function teach() {
    if (!lastResult || !lastResult.question) return;
    var answer = $('answer').value.trim();
    if (!answer) return;
    var missing = lastResult.intent === 'unknown' ? [] :
      (lastResult.slots && lastResult.question ? missingSlot(lastResult) : []);
    var slot = missing[0] || 'answer';
    var out = CS.learnFromAnswer(profile, slot, answer);
    profile = out.profile;
    $('learn-note').textContent = out.note + ' Try the same instruction again.';
    renderProfile();
  }

  // The missing slot is the one the question was asked about: recover it by
  // matching the question text back to the slot list.
  function missingSlot(result) {
    var q = result.question || '';
    if (/about\?/i.test(q)) return ['topic'];
    if (/send it to/i.test(q)) return ['person'];
    if (/post it/i.test(q)) return ['platform'];
    if (/tell /.test(q)) return ['content'];
    if (/remind you about/i.test(q)) return ['task'];
    if (/event/i.test(q)) return ['event'];
    if (/^When\?/.test(q)) return ['time'];
    if (/get\?/i.test(q)) return ['item'];
    if (/look up/i.test(q)) return ['query'];
    return ['content'];
  }

  function readProfileForm() {
    var people = {};
    $('p-people').value.split('\n').forEach(function (line) {
      var parts = line.split(':');
      if (parts.length >= 2) people[parts[0].trim()] = parts.slice(1).join(':').trim();
    });
    profile.name = $('p-name').value.trim();
    profile.interests = $('p-interests').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    profile.projects = $('p-projects').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    profile.people = people;
    profile.preferences.defaultPlatform = $('p-platform').value;
    profile.preferences.tone = $('p-tone').value;
    profile.routines = $('p-routines').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    return profile;
  }

  $('go').onclick = understand;
  $('input').addEventListener('keydown', function (e) { if (e.key === 'Enter') understand(); });
  $('answer-go').onclick = teach;
  $('answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') teach(); });
  $('save-profile').onclick = function () {
    profile = CS.saveProfile(readProfileForm());
    renderProfile();
  };
  $('reset-profile').onclick = function () {
    profile = CS.resetProfile();
    renderProfile();
  };
  $('copy').onclick = function () {
    if (!lastResult) return;
    var text = 'Instruction: ' + lastInstruction + '\n' +
      'Intent: ' + lastResult.intent + ' (' + lastResult.confidence + ' confidence)\n' +
      'Understood as: ' + lastResult.action + '\n' +
      'Assumptions: ' + (lastResult.assumptions.map(function (a) {
        return a.slot + '=' + a.value + ' (' + a.source + ')';
      }).join('; ') || 'none');
    if (navigator.clipboard) navigator.clipboard.writeText(text);
  };

  var chips = $('chips');
  EXAMPLES.forEach(function (ex) {
    var b = document.createElement('button');
    b.textContent = ex;
    b.onclick = function () { $('input').value = ex; understand(); };
    chips.appendChild(b);
  });

  renderProfile();
})();
