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

    // Decorative hit counter (no backend; a per-visitor number in localStorage)
    var lcd = document.getElementById('hit-counter');
    if (lcd) {
      var n = 1337;
      try {
        n = parseInt(localStorage.getItem('hits') || '1337', 10) + 1;
        localStorage.setItem('hits', String(n));
      } catch (e) {}
      lcd.textContent = ('00000000' + n).slice(-8);
    }

    // Car-history photos: swap a placeholder for the real image once it exists
    var slots = document.querySelectorAll('.car-photo[data-src]');
    Array.prototype.forEach.call(slots, function (box) {
      var src = box.getAttribute('data-src');
      var probe = new Image();
      probe.onload = function () {
        var img = document.createElement('img');
        img.src = src; img.className = 'car-img'; img.loading = 'lazy';
        img.alt = box.textContent.replace(/^📷[^—]*—\s*/, '').trim();
        box.replaceWith(img);
      };
      probe.src = src;
    });

    // Click-to-play chiptune via WebAudio — never autoplay, no asset needed
    var midi = document.getElementById('midi-btn');
    if (midi) {
      midi.addEventListener('click', function () {
        try {
          var Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          var ctx = new Ctx();
          var notes = [523, 587, 659, 784, 659, 587, 523, 659];
          var t = ctx.currentTime;
          notes.forEach(function (f, i) {
            var o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'square'; o.frequency.value = f;
            g.gain.setValueAtTime(0.06, t + i * 0.18);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.16);
            o.connect(g); g.connect(ctx.destination);
            o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.17);
          });
        } catch (e) {}
      });
    }
  });
})();
