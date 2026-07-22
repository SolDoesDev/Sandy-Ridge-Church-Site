/* Sandy Ridge Church — sermon library filtering
 * ===============================================================
 * TWO DATA SOURCES, ONE FILTER UI
 * ---------------------------------------------------------------
 * 1) LIVE FROM YOUTUBE (real dates, auto-updating):
 *    Set YT_CONFIG.apiKey below to a YouTube Data API v3 key.
 *    The script then pulls every upload from the channel's
 *    uploads playlist, reads each video's real publish date, and
 *    builds the Date filter (by year) from those actual dates.
 *    - Get a key: https://console.cloud.google.com  →  enable
 *      "YouTube Data API v3"  →  create an API key  →  (recommended)
 *      restrict it by HTTP referrer to your website's domain.
 *    - Series / Speaker / Topic are NOT provided by YouTube. To add
 *      those to a live video, match its title in META_BY_TITLE below
 *      (optional — anything unmatched still shows with its date).
 *
 * 2) MANUAL FALLBACK (used when no apiKey is set, or if the API
 *    call fails): the SERMONS array further down. Fully featured
 *    with series/speaker/topic/scripture.
 * =============================================================== */

const YT_CONFIG = {
  apiKey: "",                                  // ← paste your API key here to go live
  uploadsPlaylistId: "UU8fvQzA4vhq0C3ffBFyfpIw", // Sandy Ridge uploads playlist
  maxVideos: 200                               // safety cap on how many to pull
};

/* Optional: enrich live YouTube videos with metadata the API can't
 * give us. Key = exact video title (case-insensitive). */
const META_BY_TITLE = {
  // "The Word Became Flesh": { series: "The Gospel of John", speaker: "Pastor Mark Reynolds", topic: "The Person of Christ", scripture: "John 1:1–18" },
};

/* Manual fallback data (also the template for META_BY_TITLE fields). */
const SERMONS = [
  { title: "The Word Became Flesh", series: "The Gospel of John", speaker: "Pastor Mark Reynolds", topic: "The Person of Christ", date: "2026-07-13", scripture: "John 1:1–18", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "Living Water", series: "The Gospel of John", speaker: "Pastor Mark Reynolds", topic: "Grace", date: "2026-07-06", scripture: "John 4:1–26", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "The Bread of Life", series: "The Gospel of John", speaker: "Pastor Dave Coleman", topic: "The Person of Christ", date: "2026-06-29", scripture: "John 6:22–40", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "Rooted in Christ", series: "Colossians", speaker: "Pastor Mark Reynolds", topic: "Discipleship", date: "2026-06-22", scripture: "Colossians 2:6–15", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "Set Your Mind Above", series: "Colossians", speaker: "Pastor Dave Coleman", topic: "Discipleship", date: "2026-06-15", scripture: "Colossians 3:1–17", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "A Household of Faith", series: "Colossians", speaker: "Pastor Mark Reynolds", topic: "Family", date: "2026-06-08", scripture: "Colossians 3:18–4:1", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "The God Who Provides", series: "Standalone Messages", speaker: "Guest: Dr. Alan Pierce", topic: "Trust", date: "2026-06-01", scripture: "Genesis 22:1–19", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "Rejoice Always", series: "Philippians", speaker: "Pastor Mark Reynolds", topic: "Joy", date: "2026-05-25", scripture: "Philippians 4:4–9", url: "https://www.youtube.com/@sandyridgechurch" },
  { title: "To Live Is Christ", series: "Philippians", speaker: "Pastor Dave Coleman", topic: "The Person of Christ", date: "2026-05-18", scripture: "Philippians 1:18–26", url: "https://www.youtube.com/@sandyridgechurch" }
];

(function () {
  const $ = (id) => document.getElementById(id);
  const listEl = $("sermon-list");
  if (!listEl) return;

  const els = {
    series: $("filter-series"), speaker: $("filter-speaker"),
    topic: $("filter-topic"), year: $("filter-year"),
    search: $("filter-search"), clear: $("filter-clear"),
    count: $("sermon-count"), empty: $("sermon-empty"), list: listEl
  };

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return { day: String(d).padStart(2, "0"), mon: monthNames[m - 1], year: y };
  };
  const escapeHtml = (str) => String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- Pull every upload from the YouTube uploads playlist ----
  async function fetchYouTube() {
    const out = [];
    let pageToken = "";
    do {
      const url = "https://www.googleapis.com/youtube/v3/playlistItems"
        + "?part=snippet&maxResults=50"
        + "&playlistId=" + encodeURIComponent(YT_CONFIG.uploadsPlaylistId)
        + "&key=" + encodeURIComponent(YT_CONFIG.apiKey)
        + (pageToken ? "&pageToken=" + pageToken : "");
      const res = await fetch(url);
      if (!res.ok) throw new Error("YouTube API " + res.status);
      const data = await res.json();
      (data.items || []).forEach((it) => {
        const sn = it.snippet || {};
        const vid = sn.resourceId && sn.resourceId.videoId;
        if (!vid || !sn.publishedAt) return;
        const meta = META_BY_TITLE[(sn.title || "").toLowerCase()] || {};
        out.push({
          title: sn.title || "Untitled message",
          date: sn.publishedAt.slice(0, 10),           // real publish date → YYYY-MM-DD
          url: "https://www.youtube.com/watch?v=" + vid,
          series: meta.series || "",
          speaker: meta.speaker || "",
          topic: meta.topic || "",
          scripture: meta.scripture || ""
        });
      });
      pageToken = data.nextPageToken || "";
    } while (pageToken && out.length < YT_CONFIG.maxVideos);
    return out;
  }

  // ---- Filter UI, built from whatever dataset is active ----
  let DATA = [];

  const fill = (sel, values, keepFirst) => {
    while (sel.options.length > (keepFirst ? 1 : 0)) sel.remove(keepFirst ? 1 : 0);
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
  };
  const uniq = (key) => [...new Set(DATA.map((s) => s[key]).filter(Boolean))].sort();

  function buildFilters() {
    fill(els.series, uniq("series"), true);
    fill(els.speaker, uniq("speaker"), true);
    fill(els.topic, uniq("topic"), true);
    fill(els.year, [...new Set(DATA.map((s) => s.date.slice(0, 4)))].sort().reverse(), true);
    // Hide a filter that has no data (e.g. topics when running live w/o META)
    [["series", els.series], ["speaker", els.speaker], ["topic", els.topic]].forEach(([, sel]) => {
      const wrap = sel.closest("label");
      if (wrap) wrap.style.display = sel.options.length > 1 ? "" : "none";
    });
  }

  function render() {
    const f = {
      series: els.series.value, speaker: els.speaker.value,
      topic: els.topic.value, year: els.year.value,
      q: els.search.value.trim().toLowerCase()
    };
    els.clear.style.display = (f.series || f.speaker || f.topic || f.year || f.q) ? "" : "none";

    const matches = DATA.filter((s) => {
      if (f.series && s.series !== f.series) return false;
      if (f.speaker && s.speaker !== f.speaker) return false;
      if (f.topic && s.topic !== f.topic) return false;
      if (f.year && !s.date.startsWith(f.year)) return false;
      if (f.q) {
        const hay = (s.title + " " + s.scripture + " " + s.series + " " + s.topic + " " + s.speaker).toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));

    els.count.textContent = matches.length + (matches.length === 1 ? " sermon" : " sermons");
    els.empty.style.display = matches.length ? "none" : "";
    els.list.style.display = matches.length ? "" : "none";

    els.list.innerHTML = matches.map((s) => {
      const d = fmtDate(s.date);
      const metaBits = [s.series, s.scripture, s.speaker].filter(Boolean).join(" &middot; ");
      return `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="sermon-row">
        <span class="sermon-row__date"><strong>${d.day}</strong><span>${d.mon} ${d.year}</span></span>
        <span class="sermon-row__body">
          <span class="sermon-row__title">${escapeHtml(s.title)}</span>
          ${metaBits ? `<span class="sermon-row__meta">${metaBits}</span>` : ""}
          ${s.topic ? `<span class="sermon-row__tag">${escapeHtml(s.topic)}</span>` : ""}
        </span>
        <span class="sermon-row__cta">Watch &rarr;</span>
      </a>`;
    }).join("");
  }

  [els.series, els.speaker, els.topic, els.year].forEach((el) => el.addEventListener("change", render));
  els.search.addEventListener("input", render);
  els.clear.addEventListener("click", () => {
    els.series.value = els.speaker.value = els.topic.value = els.year.value = els.search.value = "";
    render();
  });

  function activate(data) {
    DATA = data;
    buildFilters();
    render();
  }

  // Try live YouTube first (if a key is configured), else use manual data.
  if (YT_CONFIG.apiKey) {
    els.count.textContent = "Loading sermons…";
    fetchYouTube()
      .then((vids) => activate(vids.length ? vids : SERMONS))
      .catch((err) => {
        console.warn("Sermon sync fell back to manual list:", err);
        activate(SERMONS);
      });
  } else {
    activate(SERMONS);
  }
})();
