(function () {
  "use strict";

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

  var PRICE_WEEK = 7700;
  var PRICE_DAY = 1100;
  var PRICE_PREMIUM = 11000;

  var MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  var MONTHS_SHORT = ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];
  var WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

  var selected = null;
  var saved = false;
  var STORAGE_KEY = "516klappen-bokning";

  function readDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function writeDraft() {
    try {
      var payload = {
        weekKey: formValue("fieldWeekKey"),
        week: formValue("fieldWeek"),
        checkIn: formValue("fieldIn"),
        checkOut: formValue("fieldOut"),
        priceSek: formValue("fieldPrice"),
        name: formValue("guestName"),
        email: formValue("guestEmail"),
        phone: formValue("guestPhone"),
        guests: formValue("guestCount"),
        message: formValue("guestMessage"),
        saved: saved
      };
      if (saved) {
        var statusEl = field("requestStatus");
        payload.status = statusEl ? statusEl.textContent : "";
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function forgetDraft() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function formValue(id) {
    var el = field(id);
    return el ? el.value : "";
  }

  function restoreText(id, value) {
    var el = field(id);
    if (!el) return;
    if (typeof value === "string" || typeof value === "number") el.value = String(value);
  }

  function findStoredWeek(key) {
    var seasons = ["winter", "summer"];
    var s, weeks, i;
    for (s = 0; s < seasons.length; s++) {
      weeks = buildWeeks(seasons[s]);
      for (i = 0; i < weeks.length; i++) {
        if (weeks[i].key === key) return { season: seasons[s], week: weeks[i] };
      }
    }
    return null;
  }

  function showSeason(seasonKey) {
    var tabs = document.querySelectorAll(".seasons button");
    tabs.forEach(function (t) {
      t.setAttribute("aria-selected", t.getAttribute("data-season") === seasonKey ? "true" : "false");
    });
    render(seasonKey);
  }

  function restoreDraft() {
    var data = readDraft();
    if (!data) return false;
    restoreText("guestName", data.name);
    restoreText("guestEmail", data.email);
    restoreText("guestPhone", data.phone);
    restoreText("guestCount", data.guests);
    restoreText("guestMessage", data.message);
    var key = typeof data.weekKey === "string" ? data.weekKey : "";
    var found = key ? findStoredWeek(key) : null;
    if (found && canBook(found.week)) {
      selected = found.week;
      setHidden(selected);
      setHint();
      renderChoice();
      if (data.saved === true) {
        saved = true;
        if (typeof data.status === "string") setStatus(data.status, "saved");
      }
      showSeason(found.season);
      return true;
    }
    if (key) {
      selected = null;
      saved = false;
      setHidden(null);
      setHint();
      renderChoice();
      setStatus("Den tidigare valda veckan kan inte längre väljas. Välj en vecka igen. Inget mejl har skickats.", "error");
      render("winter");
      return true;
    }
    setHint();
    renderChoice();
    render("winter");
    return true;
  }

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
  function weekday(d) { return WEEKDAYS[d.getDay()]; }
  function sek(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + "\u00a0kr";
  }
  function kronor(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kr";
  }
  function nightPhrase(n) {
    return n === 1 ? "1 natt" : n + " nätter";
  }
  function field(id) { return document.getElementById(id); }

  function nightsOf(w) {
    return Math.round((w.to - w.from) / 86400000);
  }
  function priceOf(w) {
    var nights = nightsOf(w);
    if (nights < 1) return { nights: nights, amount: 0, kind: "none" };
    if (nights < 7) return { nights: nights, amount: nights * PRICE_DAY, kind: "days" };
    if (w.premium) return { nights: nights, amount: PRICE_PREMIUM, kind: "premium" };
    return { nights: nights, amount: PRICE_WEEK, kind: "week" };
  }
  function priceLabel(p) {
    if (p.kind === "premium") return sek(p.amount) + ", premiumvecka";
    if (p.kind === "week") return sek(p.amount);
    if (p.kind === "days") return sek(p.amount) + " (" + p.nights + " dygn × " + sek(PRICE_DAY) + ")";
    return "Inget dygn inom säsongen";
  }
  function canBook(w) {
    return !w.booked && priceOf(w).kind !== "none";
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

  function weekAria(w, price, isSel) {
    var label = "Vecka " + w.week + ", " + fmtLong(w.from) + "–" + fmtLong(w.to);
    if (w.booked) label += ", Bokad";
    else {
      label += ", " + kronor(price.amount);
      if (price.nights < 7) label += ", " + nightPhrase(price.nights);
    }
    if (isSel) label += ", vald";
    return label;
  }

  function render(seasonKey) {
    var grid = field("calendar");
    var summary = field("seasonSummary");
    if (!grid) return;
    var weeks = buildWeeks(seasonKey);
    var counts = { ok: 0, premium: 0, booked: 0, short: 0 };
    var groups = [];
    var index = {};
    weeks.forEach(function (w) {
      var price = priceOf(w);
      if (price.nights < 1) return;
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
        var price = priceOf(w);
        if (price.nights < 1) return;
        var btn = document.createElement("button");
        btn.type = "button";
        var cls = w.booked ? "booked" : (w.premium ? "premium" : "ok");
        var isSel = !!(selected && selected.key === w.key);
        btn.className = "week " + cls + (isSel ? " is-selected" : "");
        btn.setAttribute("aria-pressed", isSel ? "true" : "false");
        if (!canBook(w)) {
          btn.disabled = true;
          btn.setAttribute("aria-disabled", "true");
        }
        btn.setAttribute("aria-label", weekAria(w, price, isSel));
        var num = document.createElement("span");
        num.className = "num";
        num.textContent = "v" + w.week;
        var when = document.createElement("span");
        when.className = "when";
        when.textContent = fmtDay(w.from) + "–" + fmtDay(w.to);
        btn.appendChild(num);
        btn.appendChild(when);
        if (w.booked) {
          var stateEl = document.createElement("span");
          stateEl.className = "state";
          stateEl.textContent = "Bokad";
          btn.appendChild(stateEl);
        } else {
          var priceEl = document.createElement("span");
          priceEl.className = "price";
          priceEl.textContent = kronor(price.amount);
          btn.appendChild(priceEl);
          if (price.nights < 7) {
            var nightsEl = document.createElement("span");
            nightsEl.className = "nights";
            nightsEl.textContent = nightPhrase(price.nights);
            btn.appendChild(nightsEl);
          }
        }
        if (canBook(w)) btn.addEventListener("click", function () { choose(w); });
        wrap.appendChild(btn);
      });
      block.appendChild(h);
      block.appendChild(wrap);
      grid.appendChild(block);
    });

    if (summary) {
      var total = counts.ok + counts.premium + counts.booked + counts.short;
      var text = "Totalt " + total + " veckor · Lediga: " + counts.ok +
        " · Premium: " + counts.premium +
        " · Bokade: " + counts.booked;
      if (counts.short) text += " · Utan natt: " + counts.short;
      summary.textContent = text;
    }
  }

  function setStatus(text, kind) {
    var el = field("requestStatus");
    if (!el) return;
    el.textContent = text || "";
    el.className = "status" + (kind ? " is-" + kind : "");
  }

  function setHint() {
    var hint = field("saveHint");
    var send = field("sendRequest");
    if (send) send.disabled = !selected;
    if (!hint) return;
    hint.textContent = selected
      ? "Sparar bara här på sidan. Inget mejl skickas."
      : "Välj en vecka i steg 1 för att kunna spara.";
  }

  function setHidden(w) {
    var price = w ? priceOf(w) : null;
    field("fieldWeekKey").value = w ? w.key : "";
    field("fieldWeek").value = w ? String(w.week) : "";
    field("fieldIn").value = w ? iso(w.from) : "";
    field("fieldOut").value = w ? iso(w.to) : "";
    field("fieldPrice").value = price && price.kind !== "none" ? String(price.amount) : "";
  }

  function renderChoice() {
    var box = field("valdVecka");
    if (!box) return;
    box.textContent = "";
    if (!selected) {
      box.className = "choice is-empty";
      var p = document.createElement("p");
      p.textContent = "Ingen vecka vald. Välj en ledig vecka i steg 1.";
      box.appendChild(p);
      return;
    }
    box.className = "choice";
    var price = priceOf(selected);
    var dl = document.createElement("dl");
    [
      ["Vecka", "Vecka " + selected.week + ", " + selected.year],
      ["Incheckning", weekday(selected.from) + " " + fmtLong(selected.from)],
      ["Utcheckning", weekday(selected.to) + " " + fmtLong(selected.to)],
      ["Pris", priceLabel(price)]
    ].forEach(function (row) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      dd.textContent = row[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
    box.appendChild(dl);
    if (price.kind === "days") {
      var note = document.createElement("p");
      note.className = "hint";
      note.textContent = "Veckan är kortare än sju dygn eftersom säsongen tar slut " + fmtLong(selected.to) + ". Priset är 1\u00a0100\u00a0kr per dygn.";
      box.appendChild(note);
    }
  }

  function currentSeason() {
    var season = document.querySelector(".seasons button[aria-selected='true']");
    return season ? season.getAttribute("data-season") : "winter";
  }

  function noteCalendar(text) {
    var el = field("calendarNote");
    if (el) el.textContent = text || "";
  }

  function choose(w) {
    if (!canBook(w)) {
      noteCalendar(w.booked
        ? "Vecka " + w.week + " är bokad och går inte att välja."
        : "Vecka " + w.week + " har ingen natt inom säsongen och går inte att välja.");
      return;
    }
    var changed = !selected || selected.key !== w.key;
    selected = w;
    if (changed && saved) {
      saved = false;
      setStatus("Du har valt en annan vecka. Spara igen om det här ska gälla. Inget mejl skickas.", "");
    } else if (!saved) {
      setStatus("", "");
    }
    noteCalendar("");
    setHidden(w);
    setHint();
    renderChoice();
    render(currentSeason());
    writeDraft();
    var box = field("valdVecka");
    if (!box) return;
    var narrow = window.matchMedia("(max-width: 899px)").matches;
    if (narrow) {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    box.focus({ preventScroll: !narrow });
  }

  function clearWeek(dropStorage) {
    selected = null;
    saved = false;
    setHidden(null);
    setHint();
    renderChoice();
    setStatus("", "");
    noteCalendar("");
    ["guestName", "guestEmail", "guestPhone", "guestCount", "guestMessage"].forEach(function (id) {
      var el = field(id);
      if (el) el.removeAttribute("aria-invalid");
    });
    if (dropStorage) forgetDraft();
  }

  function markInvalid(id, on) {
    var el = field(id);
    if (!el) return;
    if (on) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  }

  function validate() {
    ["guestName", "guestEmail", "guestPhone", "guestCount"].forEach(function (id) {
      markInvalid(id, false);
    });
    if (!selected || !canBook(selected)) {
      return { message: "Välj en ledig vecka i steg 1.", focusId: null };
    }
    var name = field("guestName").value.trim();
    if (name.length < 2) return { message: "Fyll i namn.", focusId: "guestName" };
    var email = field("guestEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { message: "Fyll i en e-postadress, till exempel namn@example.com.", focusId: "guestEmail" };
    }
    var phone = field("guestPhone").value.trim();
    if (phone.replace(/\D/g, "").length < 7) {
      return { message: "Fyll i ett telefonnummer.", focusId: "guestPhone" };
    }
    var guestsRaw = field("guestCount").value.trim();
    var guests = Number(guestsRaw);
    if (!/^\d+$/.test(guestsRaw) || guests < 1 || guests > 8) {
      return { message: "Ange antal gäster från 1 till 8.", focusId: "guestCount" };
    }
    return {
      message: "",
      value: {
        name: name,
        email: email,
        phone: phone,
        guests: guests,
        message: field("guestMessage").value.trim(),
        price: priceOf(selected)
      }
    };
  }

  /* No mail endpoint yet. The named fields stay in the form
     (weekKey, week, checkIn, checkOut, priceSek, name, email, phone, guests, message)
     so a later request can read them. Do not tell the guest that email was sent. */
  function onSubmit() {
    var result = validate();
    if (result.message) {
      saved = false;
      setStatus(result.message, "error");
      if (result.focusId) {
        markInvalid(result.focusId, true);
        var el = field(result.focusId);
        if (el) el.focus();
      }
      return;
    }
    var v = result.value;
    field("guestName").value = v.name;
    field("guestEmail").value = v.email;
    field("guestPhone").value = v.phone;
    field("guestCount").value = String(v.guests);
    field("guestMessage").value = v.message;
    setHidden(selected);
    var now = new Date();
    var clock = pad(now.getHours()) + ":" + pad(now.getMinutes());
    var lines = [
      "Sparat på den här sidan kl. " + clock + ".",
      "Inget mejl har skickats, så ingen har tagit emot förfrågan. Hör av er på +46 70 327 58 45 eller mikaelvispen@gmail.com.",
      "",
      "Vecka " + selected.week + ", " + selected.year,
      "Incheckning: " + weekday(selected.from) + " " + fmtLong(selected.from),
      "Utcheckning: " + weekday(selected.to) + " " + fmtLong(selected.to),
      "Pris: " + priceLabel(v.price),
      "Namn: " + v.name,
      "E-post: " + v.email,
      "Telefon: " + v.phone,
      "Gäster: " + v.guests,
      "Meddelande: " + (v.message || "inget")
    ];
    saved = true;
    setStatus(lines.join("\n"), "saved");
    writeDraft();
    var status = field("requestStatus");
    if (status) status.focus && status.setAttribute("tabindex", "-1");
    if (status) status.focus();
  }

  function init() {
    var y = field("year");
    if (y) y.textContent = String(new Date().getFullYear());

    var tabs = document.querySelectorAll(".seasons button");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        clearWeek(true);
        render(tab.getAttribute("data-season"));
      });
    });

    var form = field("bokning");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        onSubmit();
      });
      form.addEventListener("input", function (event) {
        var t = event.target;
        if (t && t.id) markInvalid(t.id, false);
        if (saved) {
          saved = false;
          setStatus("Ändringen är inte sparad. Spara igen om det här ska gälla. Inget mejl skickas.", "");
        }
        writeDraft();
      });
    }

    clearWeek();
    if (!restoreDraft()) render("winter");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
