/* =========================================================
   Sandy Ridge Church — sermons page
   Pulls recent uploads from a YouTube channel via the
   YouTube Data API v3 and renders + filters them.
   ========================================================= */

// ---- YouTube Data API v3 configuration -------------------
// Put your own values here. If left blank, the page falls
// back to a friendly message instead of an empty list.
const YT_API_KEY = '';               // <-- Your YouTube Data API v3 key
const YT_CHANNEL_ID = '';            // <-- Your YouTube channel ID
const YT_MAX_RESULTS = 24;
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  var listEl = document.getElementById('sermon-list');
  if (!listEl) return;

  var seriesSelect = document.getElementById('filter-series');
  var speakerSelect = document.getElementById('filter-speaker');
  var topicSelect = document.getElementById('filter-topic');

  if (!YT_API_KEY || !YT_CHANNEL_ID) {
    listEl.innerHTML =
      '<p class="sermon-note">Sermon videos aren\'t connected yet. Add a YouTube API key and channel ID in ' +
      '<code>js/sermons.js</code> to display recent messages here. In the meantime, visit our ' +
      '<a href="https://www.youtube.com/@sandyridgechurch" target="_blank" rel="noopener">YouTube channel</a> directly.</p>';
    return;
  }

  loadSermons();

  async function loadSermons() {
    listEl.innerHTML = '<p class="sermon-note">Loading sermons…</p>';
    try {
      var url = 'https://www.googleapis.com/youtube/v3/search'
        + '?key=' + encodeURIComponent(YT_API_KEY)
        + '&channelId=' + encodeURIComponent(YT_CHANNEL_ID)
        + '&part=snippet&order=date&type=video&maxResults=' + YT_MAX_RESULTS;

      var res = await fetch(url);
      if (!res.ok) throw new Error('YouTube API error (' + res.status + ')');
      var data = await res.json();
      if (!data.items || !data.items.length) throw new Error('No videos returned');

      var videos = data.items.map(function (item) {
        var snippet = item.snippet;
        return {
          id: item.id.videoId,
          title: snippet.title,
          description: snippet.description || '',
          published: snippet.publishedAt,
          series: parseTag(snippet.title, 'Series') || parseTag(snippet.description, 'Series') || '',
          speaker: parseTag(snippet.title, 'Speaker') || parseTag(snippet.description, 'Speaker') || '',
          topic: parseTag(snippet.title, 'Topic') || parseTag(snippet.description, 'Topic') || ''
        };
      });

      populateFilter(seriesSelect, uniqueValues(videos, 'series'));
      populateFilter(speakerSelect, uniqueValues(videos, 'speaker'));
      populateFilter(topicSelect, uniqueValues(videos, 'topic'));

      function render() {
        var s = seriesSelect ? seriesSelect.value : '';
        var sp = speakerSelect ? speakerSelect.value : '';
        var t = topicSelect ? topicSelect.value : '';

        var filtered = videos.filter(function (v) {
          return (!s || v.series === s) && (!sp || v.speaker === sp) && (!t || v.topic === t);
        });

        if (!filtered.length) {
          listEl.innerHTML = '<p class="sermon-note">No sermons match those filters.</p>';
          return;
        }

        listEl.innerHTML = filtered.map(rowTemplate).join('');
      }

      [seriesSelect, speakerSelect, topicSelect].forEach(function (select) {
        if (select) select.addEventListener('change', render);
      });

      render();
    } catch (err) {
      listEl.innerHTML = '<p class="sermon-note">Couldn\'t load sermons right now (' + escapeHtml(err.message) + '). Please check back soon.</p>';
    }
  }

  function rowTemplate(v) {
    var d = new Date(v.published);
    var day = isNaN(d) ? '' : d.getDate();
    var month = isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    var metaBits = [];
    if (v.speaker) metaBits.push(v.speaker);
    if (!isNaN(d)) metaBits.push(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

    return '' +
      '<article class="sermon-row">' +
      '<div class="sermon-date"><span class="day">' + day + '</span><span class="month">' + month + '</span></div>' +
      '<div class="sermon-body">' +
      '<div class="sermon-title">' + escapeHtml(v.title) + '</div>' +
      '<div class="sermon-meta">' + escapeHtml(metaBits.join(' · ')) + '</div>' +
      (v.series ? '<span class="sermon-tag">' + escapeHtml(v.series) + '</span>' : '') +
      '</div>' +
      '<a class="sermon-watch" href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">Watch →</a>' +
      '</article>';
  }

  function populateFilter(select, values) {
    if (!select || !values.length) return;
    values.forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  }

  function uniqueValues(items, key) {
    var set = new Set();
    items.forEach(function (i) { if (i[key]) set.add(i[key]); });
    return Array.from(set).sort();
  }

  function parseTag(text, tag) {
    if (!text) return null;
    var match = text.match(new RegExp(tag + '\\s*:\\s*([^\\n\\r|]+)', 'i'));
    return match ? match[1].trim() : null;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
});
