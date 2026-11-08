(function (root) {
  root.CommonSense = root.CommonSense || {};
  var CS = root.CommonSense;

  var _providers = {};

  CS.registerProvider = function (name, fn) {
    if (typeof fn !== 'function') throw new Error('Provider must be a function.');
    _providers[name] = fn;
    return name;
  };
  CS.unregisterProvider = function (name) { delete _providers[name]; };
  CS.getProviders = function () { return Object.assign({}, _providers); };

  CS.runProviders = function (profile) {
    var names = Object.keys(_providers);
    if (!names.length) return Promise.resolve({});
    var promises = names.map(function (name) {
      return Promise.resolve()
        .then(function () { return _providers[name](profile); })
        .catch(function () { return {}; });
    });
    return Promise.all(promises).then(function (results) {
      return results.reduce(function (m, p) { return Object.assign(m, p || {}); }, {});
    });
  };

  CS.createCalendarProvider = function (events) {
    return function (profile) {
      var now = Date.now();
      var topics = (profile.interests || []).concat(profile.projects || []);
      var upcoming = (events || [])
        .filter(function (e) { return new Date(e.start).getTime() > now; })
        .sort(function (a, b) { return new Date(a.start) - new Date(b.start); });
      for (var i = 0; i < upcoming.length; i++) {
        var title = (upcoming[i].title || '').toLowerCase();
        for (var j = 0; j < topics.length; j++) {
          if (title.indexOf(topics[j].toLowerCase()) !== -1) {
            return Promise.resolve({ time: _rel(new Date(upcoming[i].start)) });
          }
        }
      }
      if (upcoming.length) return Promise.resolve({ time: _rel(new Date(upcoming[0].start)) });
      return Promise.resolve({});
    };
  };

  CS.createLocationProvider = function (coords, reverseGeocode) {
    return function () {
      if (!coords || !reverseGeocode) return Promise.resolve({});
      return reverseGeocode(coords.lat, coords.lon)
        .then(function (place) { return { nearby: place }; })
        .catch(function () { return {}; });
    };
  };

  CS.createNotesProvider = function (recentDocs) {
    return function (profile) {
      var topics = (profile.interests || []).concat(profile.projects || []);
      var sorted = (recentDocs || []).slice()
        .sort(function (a, b) { return new Date(b.editedAt) - new Date(a.editedAt); });
      for (var i = 0; i < sorted.length; i++) {
        var title = (sorted[i].title || '').toLowerCase();
        for (var j = 0; j < topics.length; j++) {
          if (title.indexOf(topics[j].toLowerCase()) !== -1) {
            return Promise.resolve({ topic: topics[j] });
          }
        }
      }
      return Promise.resolve({});
    };
  };

  function _rel(date) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var d = Math.round((target - today) / 86400000);
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d > 1 && d <= 6) return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getDay()];
    return date.toLocaleDateString();
  }

})(typeof globalThis !== 'undefined' ? globalThis : this);
