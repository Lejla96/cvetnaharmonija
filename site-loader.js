(function () {
  var SUPABASE_URL = "https://snidbpfaomksoabrazwm.supabase.co";
  var SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuaWRicGZhb21rc29hYnJhendtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzMzMjQsImV4cCI6MjA5MTMwOTMyNH0.8ILcAfBGvTNiKfp8M9ey_X9Nsy8hZ7nD5fFTN2HXDHM";

  if (!window.supabase) return;

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  var lang = document.documentElement.lang === "mk" ? "mk" : "en";

  function applySettings(settings) {
    var s = {};
    for (var i = 0; i < settings.length; i++) {
      s[settings[i].key] = settings[i].value;
    }

    // Simple text bindings: data-setting="key"
    var textEls = document.querySelectorAll("[data-setting]");
    for (var j = 0; j < textEls.length; j++) {
      var key = textEls[j].getAttribute("data-setting");
      if (s[key] !== undefined && s[key] !== "") {
        textEls[j].textContent = s[key];
      }
    }

    // HTML bindings: data-setting-html="key"
    var htmlEls = document.querySelectorAll("[data-setting-html]");
    for (var k = 0; k < htmlEls.length; k++) {
      var hkey = htmlEls[k].getAttribute("data-setting-html");
      if (s[hkey] !== undefined && s[hkey] !== "") {
        htmlEls[k].innerHTML = s[hkey];
      }
    }

    // Phone: data-setting-phone
    if (s.phone) {
      var phoneEls = document.querySelectorAll("[data-setting-phone]");
      var phoneClean = s.phone.replace(/\s+/g, "");
      for (var p = 0; p < phoneEls.length; p++) {
        phoneEls[p].textContent = s.phone;
        phoneEls[p].href = "tel:" + phoneClean;
      }
    }

    // Email: data-setting-email
    if (s.email) {
      var emailEls = document.querySelectorAll("[data-setting-email]");
      for (var e = 0; e < emailEls.length; e++) {
        emailEls[e].textContent = s.email;
        emailEls[e].href = "mailto:" + s.email;
      }
    }

    // Address eyebrow: data-setting-address
    if (s.address && s.city) {
      var addrEls = document.querySelectorAll("[data-setting-address]");
      var cityName = (s.city || "").replace(/^\d+\s*/, "");
      for (var a = 0; a < addrEls.length; a++) {
        addrEls[a].textContent = cityName + " \u2022 " + s.address + " - " + s.city;
      }
    }

    // Full address text: data-setting-full-address
    if (s.address && s.city) {
      var fullEls = document.querySelectorAll("[data-setting-full-address]");
      for (var f = 0; f < fullEls.length; f++) {
        fullEls[f].textContent = s.address + " - " + s.city;
      }
    }

    // Address block: data-setting-address-block
    var addrBlocks = document.querySelectorAll("[data-setting-address-block]");
    for (var b = 0; b < addrBlocks.length; b++) {
      var blockLang = addrBlocks[b].getAttribute("data-setting-address-block");
      var countryKey = "country_" + blockLang;
      if (s.address && s.city) {
        addrBlocks[b].innerHTML =
          s.address + "<br />" + s.city + "<br />" + (s[countryKey] || "");
      }
    }

    // Map: data-setting-map
    if (s.map_query) {
      var mapEls = document.querySelectorAll("[data-setting-map]");
      var mapUrl =
        "https://www.google.com/maps?q=" +
        encodeURIComponent(s.map_query) +
        "&output=embed";
      for (var m = 0; m < mapEls.length; m++) {
        mapEls[m].src = mapUrl;
      }
    }

    // Colors
    var root = document.documentElement.style;
    if (s.color_primary) root.setProperty("--primary", s.color_primary);
    if (s.color_primary_dark) root.setProperty("--primary-dark", s.color_primary_dark);
    if (s.color_secondary) root.setProperty("--secondary", s.color_secondary);
    if (s.color_accent) root.setProperty("--accent", s.color_accent);
    if (s.color_bg) root.setProperty("--bg", s.color_bg);
  }

  function applyGallery(images) {
    var grid = document.querySelector(".gallery-grid");
    if (!grid || !images.length) return;

    grid.innerHTML = "";
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var title = lang === "mk" ? img.title_mk : img.title_en;
      var desc = lang === "mk" ? img.description_mk : img.description_en;

      var card = document.createElement("article");
      card.className = "gallery-card";
      card.innerHTML =
        '<img class="gallery-visual" src="' +
        escapeAttr(img.url) +
        '" alt="' +
        escapeAttr(title) +
        '" style="width:100%;height:180px;object-fit:cover;border-radius:20px;margin-bottom:18px;" />' +
        "<h3>" +
        escapeHtml(title || "Gallery") +
        "</h3>" +
        "<p>" +
        escapeHtml(desc) +
        "</p>";
      grid.appendChild(card);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  // Load settings and gallery in parallel
  Promise.all([
    sb.from("site_settings").select("key, value"),
    sb
      .from("gallery_images")
      .select("*")
      .order("position", { ascending: true }),
  ])
    .then(function (results) {
      if (results[0].data) applySettings(results[0].data);
      if (results[1].data && results[1].data.length) applyGallery(results[1].data);
    })
    .catch(function (err) {
      console.warn("Site loader: could not fetch settings", err);
    });
})();
