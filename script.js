(function () {
  var fallback = [
    ["Jul 25", 58], ["Aug", 38], ["Sep", 20], ["Oct", 42], ["Nov", 14], ["Dec", 25],
    ["Jan 26", 11], ["Feb", 68], ["Mar", 65], ["Apr", 16], ["May", 42], ["Jun", 22],
    ["Jul", 12], ["Aug", 4], ["Sep", 45], ["Oct", 3]
  ];
  function boot(monthly) {
    var n0 = monthly.length;
  var peakValue = 0, peakLabel = "";
  monthly.forEach(function (d) { if (d[1] > peakValue) { peakValue = d[1]; peakLabel = d[0]; } });
  var running = 0;
    var total = monthly.map(function (d) {
      running += d[1];
      return [d[0], running];
    });

    var sum = running;
    document.querySelectorAll("[data-commits]").forEach(function (n) { n.textContent = sum; });

  var host = document.getElementById("chart");
    var title = document.getElementById("chart-title");
    var buttons = document.querySelectorAll(".seg button");
    var printMode = /[?&]print\b/.test(location.search);
    if (printMode) document.documentElement.classList.add("onepage");
    var mode = "month";
    var ns = "http://www.w3.org/2000/svg";

    function el(name, attrs, text) {
      var node = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function draw() {
      if (!host) return;
      var data = mode === "month" ? monthly : total;
      var w = Math.max(host.clientWidth, 260);
      var h = w < 420 ? 200 : 230;
      var top = 24, bottom = 26;
      var gap = w < 420 ? 4 : 7;
      var n = data.length;
      var bw = (w - gap * (n - 1)) / n;
      var max = Math.max.apply(null, data.map(function (d) { return d[1]; }));
      var plotH = h - top - bottom;
      var svg = el("svg", { viewBox: "0 0 " + w + " " + h, "aria-hidden": "true" });

      [0.5, 1].forEach(function (f) {
        var y = h - bottom - plotH * f;
        svg.appendChild(el("line", { x1: 0, x2: w, y1: y, y2: y, "class": "grid" }));
      });

      var showAllValues = bw >= 26;
      var showAllLabels = bw >= 18;

      data.forEach(function (d, i) {
        var bh = Math.max(2, (plotH * d[1]) / max);
        var x = i * (bw + gap);
        var y = h - bottom - bh;
        var isPeak = mode === "month" ? d[1] >= 65 : i === n - 1;
        var rect = el("rect", {
          style: "--i:" + i,
          x: x, y: y, width: bw, height: bh, rx: Math.min(4, bw / 3),
          "class": isPeak ? "bar peak" : "bar"
        });
        var tip = el("title", {}, d[0] + ": " + d[1] + (mode === "month" ? " commits" : " commits in total"));
        rect.appendChild(tip);
        svg.appendChild(rect);

        if (showAllValues || isPeak || i === 0) {
          svg.appendChild(el("text", { x: x + bw / 2, y: y - 6, "class": "val" }, d[1]));
        }
        if (showAllLabels || i % 2 === 0) {
          svg.appendChild(el("text", { x: x + bw / 2, y: h - 8, "class": "lab" }, d[0].split(" ")[0]));
        }
      });

      host.textContent = "";
      host.appendChild(svg);
      host.setAttribute(
        "aria-label",
        mode === "month"
          ? "Bar chart of commits per month from " + monthly[0][0] + " to " + monthly[n0 - 1][0] + ". Busiest month: " + peakLabel + " with " + peakValue + " commits."
          : "Bar chart of the running total of commits, rising from " + total[0][1] + " to " + sum + "."
      );
      if (title) title.textContent = mode === "month" ? "Commits per month" : "Running total of commits";
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode");
        buttons.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        draw();
      });
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 120);
    });
    draw();

    var root = document.documentElement;
    var toggle = document.getElementById("theme-toggle");

    function storedTheme() {
      try { return localStorage.getItem("theme"); } catch (e) { return null; }
    }
    function saveTheme(value) {
      try { localStorage.setItem("theme", value); } catch (e) { return; }
    }
    function currentIsDark() {
      var t = root.getAttribute("data-theme");
      if (t) return t === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    var saved = storedTheme();
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentIsDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        saveTheme(next);
      });
    }

    var details = document.querySelectorAll(".areas details");
    window.addEventListener("beforeprint", function () {
      details.forEach(function (d) { d.setAttribute("open", ""); });
    });

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || printMode;
    var sections = document.querySelectorAll(".main .section");

    if ("IntersectionObserver" in window && !reduce) {
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        });
      }, { threshold: 0.08 });
      sections.forEach(function (s) {
        s.classList.add("reveal");
        reveal.observe(s);
      });
    }

    var links = document.querySelectorAll(".quicknav a");
    if ("IntersectionObserver" in window && links.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.querySelector("h2").id;
          links.forEach(function (a) {
            var on = a.getAttribute("href") === "#" + id;
            a.classList.toggle("active", on);
            if (on) a.scrollIntoView({ block: "nearest", inline: "center" });
          });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      sections.forEach(function (s) { spy.observe(s); });
    }

    var fine = window.matchMedia("(pointer: fine)").matches;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || printMode;

    var bar = document.getElementById("progress");
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var typed = document.getElementById("typed");
    if (typed && !still) {
      var phrases = [
        "TypeScript · Node.js · React · Go",
        sum + " commits across 46 repositories",
        "OAuth, webhooks and developer APIs",
        "Shipping with Claude Code"
      ];
      var pi = 0, ci = 0, del = false;
      var tick = function () {
        var p = phrases[pi];
        ci += del ? -1 : 1;
        typed.textContent = p.slice(0, ci);
        var wait = del ? 28 : 55;
        if (!del && ci === p.length) { del = true; wait = 1800; }
        else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
        setTimeout(tick, wait);
      };
      typed.textContent = "";
      setTimeout(tick, 600);
    }

    document.querySelectorAll(".stats dd, .hl-n").forEach(function (dd) {
      var target = parseInt(dd.textContent, 10);
      var suffix = dd.textContent.replace(/^\d+/, "");
      if (still || isNaN(target)) return;
      dd.textContent = "0" + suffix;
      var started = false;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || started) return;
        started = true;
        io.disconnect();
        var t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 1400);
          dd.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.4 });
      io.observe(dd);
    });

    if (fine && !still) {
      document.querySelectorAll(".card, .areas details, .stats div, .cta").forEach(function (n) {
        n.classList.add("glow");
        n.addEventListener("pointermove", function (e) {
          var r = n.getBoundingClientRect();
          n.style.setProperty("--mx", e.clientX - r.left + "px");
          n.style.setProperty("--my", e.clientY - r.top + "px");
        });
      });
      document.querySelectorAll(".card").forEach(function (n) {
        n.addEventListener("pointermove", function (e) {
          var r = n.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          n.style.transform = "perspective(700px) rotateX(" + (-y * 6) + "deg) rotateY(" + (x * 8) + "deg) translateY(-3px)";
        });
        n.addEventListener("pointerleave", function () { n.style.transform = ""; });
      });
    }

    var canvas = document.getElementById("net");
    if (canvas && !still) {
      var ctx = canvas.getContext("2d");
      var pts = [], mouse = { x: -999, y: -999 }, W = 0, H = 0, running = true;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var size = function () {
        var r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(Math.min(70, (W * H) / 9000));
        pts = [];
        for (var i = 0; i < n; i++) {
          pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 });
        }
      };
      var frame = function () {
        if (running) {
          ctx.clearRect(0, 0, W, H);
          for (var i = 0; i < pts.length; i++) {
            var a = pts[i];
            a.x += a.vx; a.y += a.vy;
            if (a.x < 0 || a.x > W) a.vx *= -1;
            if (a.y < 0 || a.y > H) a.vy *= -1;
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.283); ctx.fill();
            for (var j = i + 1; j < pts.length; j++) {
              var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
              if (d < 14000) {
                ctx.strokeStyle = "rgba(220,205,255," + (0.32 * (1 - d / 14000)) + ")";
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
              }
            }
            var mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
            if (md < 22000) {
              ctx.strokeStyle = "rgba(240,171,252," + (0.6 * (1 - md / 22000)) + ")";
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
          }
        }
        requestAnimationFrame(frame);
      };
      var header = canvas.parentElement;
      header.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      header.addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
      new IntersectionObserver(function (es) { running = es[0].isIntersecting; }).observe(header);
      var rt;
      window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });
      size();
      frame();
    }
  }

  function load() {
    if (!window.fetch) return Promise.resolve(fallback);
    return fetch("commits.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) { return Array.isArray(j.months) && j.months.length ? j.months : fallback; })
      .catch(function () { return fallback; });
  }

  load().then(boot);
})();
