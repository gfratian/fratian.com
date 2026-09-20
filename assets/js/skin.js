(function () {
  'use strict';
  var root = document.documentElement;

  function current() {
    var s = root.getAttribute('data-theme');
    return (s === 'modern' || s === 'retro') ? s : 'retro';
  }
  function apply(skin) {
    root.setAttribute('data-theme', skin);
    try { localStorage.setItem('skin', skin); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('skin-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        apply(current() === 'retro' ? 'modern' : 'retro');
      });
    }
  });
})();
