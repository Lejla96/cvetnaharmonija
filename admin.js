const SUPABASE_URL = "https://snidbpfaomksoabrazwm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuaWRicGZhb21rc29hYnJhendtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzMzMjQsImV4cCI6MjA5MTMwOTMyNH0.8ILcAfBGvTNiKfp8M9ey_X9Nsy8hZ7nD5fFTN2HXDHM";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ─── Auth ───

async function checkSession() {
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session) showDashboard();
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  $("#loginError").textContent = "";

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    $("#loginError").textContent = error.message;
    return;
  }
  showDashboard();
});

$("#logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  location.reload();
});

function showDashboard() {
  $("#loginScreen").hidden = true;
  $("#dashboard").hidden = false;
  loadAllSettings();
  loadGallery();
}

// ─── Tabs ───

$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// ─── Settings ───

let settingsCache = {};

async function loadAllSettings() {
  const { data, error } = await sb
    .from("site_settings")
    .select("key, value");

  if (error) {
    console.error("Failed to load settings:", error);
    return;
  }

  settingsCache = {};
  for (const row of data) {
    settingsCache[row.key] = row.value;
  }

  $$("[data-key]").forEach((input) => {
    const val = settingsCache[input.dataset.key];
    if (val !== undefined) input.value = val;
  });
}

async function saveSettings(form, statusEl) {
  const inputs = form.querySelectorAll("[data-key]");
  const updates = [];
  for (const input of inputs) {
    const key = input.dataset.key;
    const value = input.value;
    if (settingsCache[key] !== value) {
      updates.push({ key, value, updated_at: new Date().toISOString() });
    }
  }

  if (updates.length === 0) {
    flash(statusEl, "No changes to save", "success");
    return;
  }

  const { error } = await sb.from("site_settings").upsert(updates);
  if (error) {
    flash(statusEl, "Save failed: " + error.message, "error");
    return;
  }

  for (const u of updates) settingsCache[u.key] = u.value;
  flash(statusEl, "Saved!", "success");
}

function flash(el, text, cls) {
  el.textContent = text;
  el.className = "save-status " + cls;
  setTimeout(() => {
    el.textContent = "";
    el.className = "save-status";
  }, 3000);
}

$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  saveSettings($("#contactForm"), $("#contactStatus"));
});

$("#textForm").addEventListener("submit", (e) => {
  e.preventDefault();
  saveSettings($("#textForm"), $("#textStatus"));
});

$("#colorsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  saveSettings($("#colorsForm"), $("#colorsStatus"));
});

// ─── Gallery ───

async function loadGallery() {
  const grid = $("#galleryGrid");
  grid.innerHTML = "<p style='color:var(--admin-muted)'>Loading...</p>";

  const { data, error } = await sb
    .from("gallery_images")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    grid.innerHTML = "<p class='error-text'>Failed to load gallery</p>";
    return;
  }

  if (!data.length) {
    grid.innerHTML =
      "<p style='color:var(--admin-muted)'>No images yet. Upload one above.</p>";
    return;
  }

  grid.innerHTML = "";
  for (const img of data) {
    grid.appendChild(createGalleryCard(img));
  }
}

function createGalleryCard(img) {
  const card = document.createElement("div");
  card.className = "gallery-item";
  card.dataset.id = img.id;
  card.innerHTML = `
    <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.title_en || "gallery image")}" />
    <div class="gallery-item-body">
      <input type="text" placeholder="Title (MK)" value="${escapeAttr(img.title_mk)}" data-field="title_mk" />
      <input type="text" placeholder="Title (EN)" value="${escapeAttr(img.title_en)}" data-field="title_en" />
    </div>
    <div class="gallery-item-actions">
      <button class="btn btn-sm btn-primary save-img-btn">Save</button>
      <button class="btn btn-sm btn-danger delete-img-btn">Delete</button>
    </div>
  `;

  card.querySelector(".save-img-btn").addEventListener("click", () =>
    updateGalleryImage(img.id, card)
  );
  card.querySelector(".delete-img-btn").addEventListener("click", () =>
    deleteGalleryImage(img.id, img.url, card)
  );

  return card;
}

async function updateGalleryImage(id, card) {
  const titleMk = card.querySelector('[data-field="title_mk"]').value;
  const titleEn = card.querySelector('[data-field="title_en"]').value;

  const { error } = await sb
    .from("gallery_images")
    .update({ title_mk: titleMk, title_en: titleEn })
    .eq("id", id);

  if (error) {
    alert("Update failed: " + error.message);
    return;
  }

  const btn = card.querySelector(".save-img-btn");
  btn.textContent = "Saved!";
  setTimeout(() => (btn.textContent = "Save"), 1500);
}

async function deleteGalleryImage(id, url, card) {
  if (!confirm("Delete this image?")) return;

  const filePath = url.split("/gallery/")[1];
  if (filePath) {
    await sb.storage.from("gallery").remove([decodeURIComponent(filePath)]);
  }

  const { error } = await sb.from("gallery_images").delete().eq("id", id);
  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  card.remove();
  if (!$("#galleryGrid").children.length) {
    $("#galleryGrid").innerHTML =
      "<p style='color:var(--admin-muted)'>No images yet. Upload one above.</p>";
  }
}

// ─── Upload ───

$("#uploadBtn").addEventListener("click", () => $("#imageInput").click());

$("#imageInput").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;

  const progress = $("#uploadProgress");
  const fill = $("#progressFill");
  const text = $("#progressText");
  progress.hidden = false;

  let done = 0;
  for (const file of files) {
    text.textContent = `Uploading ${done + 1} of ${files.length}...`;
    fill.style.width = `${(done / files.length) * 100}%`;

    const ext = file.name.split(".").pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await sb.storage
      .from("gallery")
      .upload(name, file, { contentType: file.type });

    if (uploadError) {
      alert(`Upload failed for ${file.name}: ${uploadError.message}`);
      continue;
    }

    const {
      data: { publicUrl },
    } = sb.storage.from("gallery").getPublicUrl(name);

    const { error: insertError } = await sb.from("gallery_images").insert({
      url: publicUrl,
      title_mk: "",
      title_en: "",
      position: Date.now(),
    });

    if (insertError) {
      alert(`Failed to save image record: ${insertError.message}`);
    }

    done++;
    fill.style.width = `${(done / files.length) * 100}%`;
  }

  text.textContent = `Done! ${done} image${done !== 1 ? "s" : ""} uploaded.`;
  setTimeout(() => {
    progress.hidden = true;
    fill.style.width = "0%";
  }, 2000);

  e.target.value = "";
  loadGallery();
});

// ─── Helpers ───

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// ─── Init ───

checkSession();
