(function () {
  "use strict";

  var FORM = "https://docs.google.com/forms/d/e/1FAIpQLSd9ln4SxS2innp2ePUCPE21DtUbBS9gO1Y-4n2cksiLSqfEuw/viewform";
  var ENTRY_WEEK = "377884520";
  var ENTRY_IN = "1022203339";
  var ENTRY_OUT = "1281773319";

  var SEASONS = {
    winter: { start: "2026-12-01", end: "2027-04-30", label: "Vinter 2026–2027" },
    summer: { start: "2027-05-01", end: "2027-10-31", label: "Sommar 2027" }
  };

  /* Vecka 7–9 är bokade (Jonathan 2026-09-29). De är också premium i prislistan,
     men bokad vinner så de går inte att välja. Vecka 12 är premium och inte bokad.
     Vecka 13 är bokad. Vecka 14 är inte premium. */
  var BOOKED = {
    "2026-W51": true,
    "2027-W07": true,
    "2027-W08": true,
    "2027-W09": true,
    "2027-W11": true,
    "2027-W13": true
  };

  /* Premium i prislistan: vecka 7–9 och 12. Vecka 7–9 är ändå bokade.
     Vecka 13 är bokad, inte premium. Vecka 14 är inte premium. */
  var PREMIUM = {
    "2027-W07": true,
    "2027-W08": true,
    "2027-W09": true,
    "2027-W12": true
  };

  var MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  var MONTHS_SHORT = ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];

  var selected = null;

  function toDate(str) {
    var p = str.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }
  function addDays(d, n) {
    var r = new Date(d.getTime());
    r.setDate(r.getDate() + n);
    return r;
  }
  function startOfSundayWeek(d) {
    var r = new Date(d.getTime());
    r.setDate(r.getDate() - r.getDay());
    return r;
  }
  function isoWeekYear(d) {
    var wday = (d.getDay() + 6) % 7;
    return addDays(d, 3 - wday).getFullYear();
  }
  function isoWeekNumber(d) {
    var wday = (d.getDay() + 6) % 7;
    var thu = addDays(d, 3 - wday);
    var year = thu.getFullYear();
    var firstThu = new Date(year, 0, 4, 12);
    var week0dow = (firstThu.getDay() + 6) % 7;
    var week0 = addDays(firstThu, -week0dow);
    var thuDow = (thu.getDay() + 6) % 7;
    var thuWeek = addDays(thu, -thuDow);
    var diffDays = Math.round((thuWeek - week0) / 86400000);
    return 1 + Math.round(diffDays / 7);
  }
  function skiWeek(sunday) {
    var thursday = addDays(sunday, 4);
    return { year: isoWeekYear(thursday), week: isoWeekNumber(thursday) };
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function fmtDay(d) {
    return d.getDate() + " " + MONTHS_SHORT[d.getMonth()];
  }
  function fmtLong(d) {
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function buildWeeks(seasonKey) {
    var start = toDate(SEASONS[seasonKey].start);
    var end = toDate(SEASONS[seasonKey].end);
    var c = startOfSundayWeek(start);
    if (c < start) c = addDays(c, 7);
    var out = [];
    while (c <= end) {
      var arrival = c;
      var departure = addDays(arrival, 7);
      var sw = skiWeek(arrival);
      var key = sw.year + "-W" + pad(sw.week);
      var from = arrival < start ? start : arrival;
      var to = departure > end ? end : departure;
      var booked = !!BOOKED[key];
      var premium = !!PREMIUM[key] && !booked;
      out.push({
        key: key,
        week: sw.week,
        year: sw.year,
        from: from,
        to: to,
        booked: booked,
        premium: premium
      });
      c = addDays(c, 7);
    }
    return out;
  }

  function monthKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }

  function render(seasonKey) {
    var grid = document.getElementById("calendar");
    var summary = document.getElementById("seasonSummary");
    if (!grid) return;
    var weeks = buildWeeks(seasonKey);
    var counts = { ok: 0, premium: 0, booked: 0 };
    var groups = [];
    var index = {};
    weeks.forEach(function (w) {
      if (w.booked) counts.booked += 1;
      else if (w.premium) counts.premium += 1;
      else counts.ok += 1;
      var mk = monthKey(w.from);
      if (!index[mk]) {
        index[mk] = { label: MONTHS[w.from.getMonth()] + " " + w.from.getFullYear(), items: [] };
        groups.push(index[mk]);
      }
      index[mk].items.push(w);
    });

    grid.textContent = "";
    groups.forEach(function (g) {
      var block = document.createElement("div");
      block.className = "month";
      var h = document.createElement("h3");
      h.textContent = g.label;
      var wrap = document.createElement("div");
      wrap.className = "weeks";
      g.items.forEach(function (w) {
        var btn = document.createElement("button");
        btn.type = "button";
        var cls = w.booked ? "booked" : (w.premium ? "premium" : "ok");
        btn.className = "week " + cls;
        if (selected && selected.key === w.key) btn.classList.add("is-selected");
        var state = w.booked ? "Bokad" : (w.premium ? "Ledig · premium 11 000 kr/vecka" : "Ledig");
        btn.setAttribute("aria-pressed", selected && selected.key === w.key ? "true" : "false");
        if (w.booked) btn.setAttribute("aria-disabled", "true");
        btn.setAttribute("aria-label", "Vecka " + w.week + ", " + fmtDay(w.from) + "–" + fmtDay(w.to) + ", " + state);
        btn.innerHTML =
          '<span class="num">v' + w.week + '</span>' +
          '<span class="when">' + fmtDay(w.from) + "–" + fmtDay(w.to) + "</span>" +
          '<span class="state">' + state + "</span>";
        btn.addEventListener("click", function () { choose(w, seasonKey); });
        wrap.appendChild(btn);
      });
      block.appendChild(h);
      block.appendChild(wrap);
      grid.appendChild(block);
    });

    if (summary) {
      var total = counts.ok + counts.premium + counts.booked;
      summary.textContent =
        "Totalt " + total + " veckor · Lediga: " + counts.ok +
        " · Premium: " + counts.premium +
        " · Bokade: " + counts.booked;
    }
  }

  function setField(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function choose(w) {
    var status = document.getElementById("requestStatus");
    if (w.booked) {
      if (status) status.textContent = "Vecka " + w.week + " är bokad och kan inte väljas.";
      return;
    }
    selected = w;
    setField("fieldWeek", "Vecka " + w.week);
    setField("fieldIn", fmtLong(w.from));
    setField("fieldOut", fmtLong(w.to));
    var send = document.getElementById("sendRequest");
    if (send) send.disabled = false;
    var days = Math.round((w.to - w.from) / 86400000);
    if (status) {
      status.textContent = days < 7
        ? "Vecka " + w.week + " är vald. Säsongen tar slut inne i veckan, så datumen är de som syns i kalendern."
        : "Vecka " + w.week + " är ifylld. Skicka förfrågan när du vill — ingen betalning sker här.";
    }
    var season = document.querySelector(".seasons button[aria-selected='true']");
    render(season ? season.getAttribute("data-season") : "winter");
    var panel = document.getElementById("bokning");
    if (panel && window.matchMedia("(max-width: 719px)").matches) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    var weekField = document.getElementById("fieldWeek");
    if (weekField) weekField.focus();
  }

  function formUrl(w) {
    var params = new URLSearchParams();
    params.set("usp", "pp_url");
    if (!w) return FORM + "?" + params.toString();
    params.set("entry." + ENTRY_WEEK, "Vecka " + w.week);
    params.set("entry." + ENTRY_IN + "_year", String(w.from.getFullYear()));
    params.set("entry." + ENTRY_IN + "_month", String(w.from.getMonth() + 1));
    params.set("entry." + ENTRY_IN + "_day", String(w.from.getDate()));
    params.set("entry." + ENTRY_OUT + "_year", String(w.to.getFullYear()));
    params.set("entry." + ENTRY_OUT + "_month", String(w.to.getMonth() + 1));
    params.set("entry." + ENTRY_OUT + "_day", String(w.to.getDate()));
    return FORM + "?" + params.toString();
  }

  function init() {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());

    var tabs = document.querySelectorAll(".seasons button");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        selected = null;
        setField("fieldWeek", "");
        setField("fieldIn", "");
        setField("fieldOut", "");
        var send = document.getElementById("sendRequest");
        if (send) send.disabled = true;
        var status = document.getElementById("requestStatus");
        if (status) status.textContent = "";
        render(tab.getAttribute("data-season"));
      });
    });

    var send = document.getElementById("sendRequest");
    if (send) {
      send.addEventListener("click", function () {
        if (!selected) return;
        window.open(formUrl(selected), "_blank", "noopener");
      });
    }
    var plain = document.getElementById("openFormPlain");
    if (plain) plain.href = FORM;

    render("winter");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
