// Carga stats.json (lo actualiza el GitHub Action cada 30 min) y anima los
// contadores cuando entran en pantalla. Si stats.json falla, usa los
// valores guardados en el HTML como respaldo.
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var statMap = {
    "stat-trophies": "trophies",
    "stat-level": "expLevel",
    "stat-3v3": "victories3v3",
    "stat-solo": "soloVictories",
    "stat-duo": "duoVictories"
  };

  function formatNumber(value) {
    return Math.round(value).toLocaleString("es-DO");
  }

  function animateCounter(el, target, suffix) {
    suffix = suffix || "";

    if (reduceMotion) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }

    var duration = 1400;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = formatNumber(target * eased) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  function observeAndAnimate(el, target, suffix) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target, target, suffix);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      observer.observe(el);
    } else {
      animateCounter(el, target, suffix);
    }
  }

  function startCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      observeAndAnimate(el, target, suffix);
    });
  }

  function showUpdatedAt(iso) {
    var el = document.getElementById("stats-updated");
    if (!el || !iso) return;
    var date = new Date(iso);
    el.textContent = "Actualizado " + date.toLocaleString("es-DO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    });
  }

  fetch("stats.json", { cache: "no-store" })
    .then(function (res) {
      return res.ok ? res.json() : Promise.reject(res.status);
    })
    .then(function (data) {
      Object.keys(statMap).forEach(function (elId) {
        var el = document.getElementById(elId);
        var value = data[statMap[elId]];
        if (el && typeof value === "number") {
          el.setAttribute("data-count", value);
        }
      });
      startCounters();
      showUpdatedAt(data.updatedAt);
    })
    .catch(function (err) {
      console.warn("stats.json no disponible, usando los valores guardados en el HTML.", err);
      startCounters();
    });
})();

// Ventana emergente del código QR
(function () {
  var openBtn = document.getElementById("openQr");
  var closeBtn = document.getElementById("closeQr");
  var modal = document.getElementById("qrModal");
  if (!openBtn || !modal) return;

  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
})();
