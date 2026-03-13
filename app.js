(function () {
  'use strict';

  const STORAGE_KEY = 'cuotiben_questions';
  const SETTINGS_KEY = 'cuotiben_settings';
  const REVIEW_INTERVALS = [1, 3, 7, 15, 30]; // 天
  const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';
  const DOUBAO_API = 'https://api.doubao-ai.com/v1/chat/completions';
  var currentDetailId = null;

  /** 只保留可放入 HTTP 头部的字符（ISO-8859-1），避免 fetch 报错 */
  function sanitizeHeaderValue(str) {
    if (typeof str !== 'string') return '';
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c >= 0x20 && c <= 0x7E) out += str[i];
    }
    return out.trim();
  }

  /** 把 fetch 的通用错误转成用户能看懂的说明 */
  function friendlyFetchError(msg) {
    var s = (msg && (msg.message || msg)) ? String(msg.message || msg) : '';
    if (s.indexOf('Failed to fetch') !== -1 || s === 'Failed to fetch')
      return '网络请求被拦截（多为浏览器跨域）。请用「错题本 APP」打开再试，或在本机用 http 服务运行此页面（如 python -m http.server 8080）后访问。';
    return s;
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function loadQuestions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveQuestions(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function getNextReviewDate(level) {
    if (level >= REVIEW_INTERVALS.length) return null;
    return addDays(todayStr(), REVIEW_INTERVALS[level]);
  }

  // ---------- 标签页切换 ----------
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = this.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      const panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
      if (target === 'list') renderList();
      if (target === 'review') renderReview();
      if (target === 'stats') renderStats();
      if (target === 'settings') loadSettings();
    });
  });

  // ---------- 添加错题 ----------
  document.getElementById('form-add').addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    const level = 0;
    const nextDate = getNextReviewDate(level);
    const item = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      subject: form.subject.value,
      chapter: (form.chapter.value || '').trim(),
      question: (form.question.value || '').trim(),
      errorType: form.errorType.value,
      knowledge: (form.knowledge.value || '').trim(),
      cause: (form.cause.value || '').trim(),
      solution: (form.solution.value || '').trim(),
      difficulty: form.difficulty.value,
      createdAt: Date.now(),
      reviewLevel: level,
      nextReviewDate: nextDate,
      lastReviewDate: null
    };
    const list = loadQuestions();
    list.unshift(item);
    saveQuestions(list);
    form.reset();
    document.querySelector('.tab[data-tab="list"]').click();
    renderList();
  });

  // ---------- 列表与筛选 ----------
  function renderList() {
    const list = loadQuestions();
    const subject = document.getElementById('filter-subject').value;
    const type = document.getElementById('filter-type').value;
    let filtered = list;
    if (subject) filtered = filtered.filter(function (q) { return q.subject === subject; });
    if (type) filtered = filtered.filter(function (q) { return q.errorType === type; });

    const ul = document.getElementById('question-list');
    const empty = document.getElementById('list-empty');
    ul.innerHTML = '';
    if (filtered.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    filtered.forEach(function (q) {
      const li = document.createElement('li');
      li.innerHTML =
        '<div class="card" data-id="' + q.id + '">' +
        '<span class="card-subject">' + q.subject + '</span>' +
        '<p class="card-title">' + escapeHtml(q.question || '（未填题目）') + '</p>' +
        '<div class="card-meta">' + q.errorType + ' · ' + (q.nextReviewDate ? '复习日: <span class="review-due">' + q.nextReviewDate + '</span>' : '已过复习周期') + '</div>' +
        '</div>';
      ul.appendChild(li);
    });
    ul.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('click', function () { openDetail(this.getAttribute('data-id')); });
    });
  }

  document.getElementById('filter-subject').addEventListener('change', renderList);
  document.getElementById('filter-type').addEventListener('change', renderList);

  // ---------- 拍照/选图识别 ----------
  document.getElementById('btn-photo-ocr').addEventListener('click', function () {
    document.getElementById('input-photo-ocr').click();
  });
  document.getElementById('input-photo-ocr').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || !file.type.match(/^image\//)) return;
    var status = document.getElementById('photo-ocr-status');
    status.classList.remove('hidden', 'error');
    status.classList.add('loading');
    status.textContent = '正在压缩图片…';
    var img = new Image();
    var reader = new FileReader();
    reader.onload = function () {
      img.onload = function () {
        var maxW = 1200;
        var w = img.width;
        var h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        status.textContent = '正在识别题目…';
        runPhotoOcr(dataUrl, function (text) {
          status.classList.remove('loading');
          status.textContent = '识别完成，已填入下方';
          var ta = document.getElementById('form-add').querySelector('textarea[name="question"]');
          ta.value = (ta.value || '').trim() ? ta.value + '\n\n' + text : text;
        }, function (err) {
          status.classList.remove('loading');
          status.classList.add('error');
          status.textContent = '识别失败：' + friendlyFetchError(err);
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  function runPhotoOcr(dataUrl, onSuccess, onError) {
    var settings;
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      settings = raw ? JSON.parse(raw) : {};
    } catch (_) { settings = {}; }
    var apiKey = (settings.apiKey || '').trim();
    if (!apiKey) {
      onError(new Error('请先在「设置」里填写 API Key'));
      return;
    }
    var provider = settings.provider || 'deepseek';
    var visionModel = (settings.visionModel || '').trim();
    var prompt = '请识别图片中的题目文字（可能是手写或印刷的数学题、语文题等）。只输出题目内容的原文，不要加“题目是”等解释，不要编造没有的内容。若无法识别请输出“无法识别”。';
    var userContent = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: dataUrl } }
    ];
    var url, model, body;
    if (provider === 'doubao') {
      url = DOUBAO_API;
      model = visionModel || (settings.doubaoModel || 'doubao-pro-32k').trim() || 'doubao-pro-32k';
      body = { model: model, messages: [{ role: 'user', content: userContent }], max_tokens: 1024 };
    } else {
      url = DEEPSEEK_API;
      model = visionModel || 'deepseek-chat';
      body = { model: model, messages: [{ role: 'user', content: userContent }], max_tokens: 1024, temperature: 0.2 };
    }
    function parseResponse(data) {
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content.trim() : (data.error && data.error.message) ? data.error.message : '';
    }
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.Http) {
      window.Capacitor.Plugins.Http.request({
        method: 'POST',
        url: url,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sanitizeHeaderValue(apiKey) },
        data: body
      }).then(function (res) {
        var data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (res.status >= 400) throw new Error(res.status + ' ' + (data.error && data.error.message ? data.error.message : res.statusText));
        var text = parseResponse(data);
        if (text) onSuccess(text); else onError(new Error('未返回文字'));
      }).catch(onError);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sanitizeHeaderValue(apiKey) },
        body: JSON.stringify(body)
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        return res.json();
      }).then(function (data) {
        var text = parseResponse(data);
        if (text) onSuccess(text); else onError(new Error('未返回文字'));
      }).catch(onError);
    }
  }

  // ---------- 今日复习 ----------
  function renderReview() {
    const list = loadQuestions();
    const today = todayStr();
    const due = list.filter(function (q) {
      return q.nextReviewDate && q.nextReviewDate <= today;
    });
    const hint = document.getElementById('review-hint');
    const ul = document.getElementById('review-list');
    const empty = document.getElementById('review-empty');
    ul.innerHTML = '';
    if (due.length === 0) {
      hint.textContent = '按 1 → 3 → 7 → 15 → 30 天间隔复习，效果更好。';
      empty.classList.remove('hidden');
      return;
    }
    hint.textContent = '今天有 ' + due.length + ' 道题待复习：';
    empty.classList.add('hidden');
    due.forEach(function (q) {
      const li = document.createElement('li');
      li.innerHTML =
        '<div class="card" data-id="' + q.id + '">' +
        '<span class="card-subject">' + q.subject + '</span>' +
        '<p class="card-title">' + escapeHtml(q.question || '（未填题目）') + '</p>' +
        '<div class="card-meta">' + q.errorType + '</div>' +
        '</div>';
      ul.appendChild(li);
    });
    ul.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('click', function () { openDetail(this.getAttribute('data-id'), true); });
    });
  }

  // ---------- 统计 ----------
  function renderStats() {
    const list = loadQuestions();
    var bySubject = {};
    var byType = {};
    list.forEach(function (q) {
      bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
      byType[q.errorType] = (byType[q.errorType] || 0) + 1;
    });
    var total = list.length;
    var maxType = Math.max.apply(null, Object.values(byType).concat(0));

    var subjectHtml = '';
    ['语文', '数学', '英语', '历史', '道法', '物理'].forEach(function (s) {
      var n = bySubject[s] || 0;
      subjectHtml += '<div class="stats-card"><span class="name">' + s + '</span><div class="count">' + n + '</div></div>';
    });
    document.getElementById('stats-by-subject').innerHTML = subjectHtml || '<div class="stats-card"><span class="name">暂无</span><div class="count">0</div></div>';

    var typeHtml = '';
    ['粗心', '概念不清', '方法不会', '审题错误', '时间不够'].forEach(function (t) {
      var n = byType[t] || 0;
      var pct = maxType ? (n / maxType * 100) : 0;
      typeHtml += '<div class="stats-type-row">' +
        '<span>' + t + '</span>' +
        '<div class="bar-wrap"><div class="bar" style="width:' + pct + '%"></div></div>' +
        '<span>' + n + '</span></div>';
    });
    document.getElementById('stats-by-type').innerHTML = typeHtml;

    var recent = list.slice(0, 10);
    var recentUl = document.getElementById('stats-recent');
    recentUl.innerHTML = '';
    recent.forEach(function (q) {
      var li = document.createElement('li');
      li.innerHTML = '<div class="card" data-id="' + q.id + '"><span class="card-subject">' + q.subject + '</span><p class="card-title">' + escapeHtml(q.question || '（未填）') + '</p></div>';
      recentUl.appendChild(li);
    });
    recentUl.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('click', function () { openDetail(this.getAttribute('data-id')); });
    });
  }

  // ---------- 详情弹层 ----------
  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      var s = raw ? JSON.parse(raw) : {};
      document.getElementById('settings-provider').value = s.provider || 'deepseek';
      document.getElementById('settings-apikey').value = s.apiKey || '';
      document.getElementById('settings-doubao-model').value = s.doubaoModel || 'doubao-pro-32k';
      document.getElementById('settings-vision-model').value = s.visionModel || '';
    } catch (_) {}
  }
  function saveSettings() {
    var s = {
      provider: document.getElementById('settings-provider').value,
      apiKey: (document.getElementById('settings-apikey').value || '').trim(),
      doubaoModel: (document.getElementById('settings-doubao-model').value || 'doubao-pro-32k').trim(),
      visionModel: (document.getElementById('settings-vision-model').value || '').trim()
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }
  document.getElementById('settings-save').addEventListener('click', function () {
    saveSettings();
    alert('已保存');
  });

  document.getElementById('settings-test-api').addEventListener('click', function () {
    var apiKey = (document.getElementById('settings-apikey').value || '').trim();
    if (!apiKey) {
      var st = document.getElementById('settings-api-status');
      st.classList.remove('hidden', 'ok', 'pending');
      st.classList.add('fail');
      st.textContent = '请先填写 API Key';
      return;
    }
    var provider = document.getElementById('settings-provider').value;
    var doubaoModel = (document.getElementById('settings-doubao-model').value || 'doubao-pro-32k').trim();
    var url = provider === 'doubao' ? DOUBAO_API : DEEPSEEK_API;
    var model = provider === 'doubao' ? doubaoModel : 'deepseek-chat';
    var body = {
      model: model,
      messages: [{ role: 'user', content: '请只回复：OK' }],
      max_tokens: 20
    };
    if (provider !== 'doubao') body.temperature = 0;
    var statusEl = document.getElementById('settings-api-status');
    statusEl.classList.remove('hidden', 'ok', 'fail');
    statusEl.classList.add('pending');
    statusEl.textContent = '正在检测连接…';
    var btn = document.getElementById('settings-test-api');
    btn.disabled = true;
    var done = function (ok, text) {
      btn.disabled = false;
      statusEl.classList.remove('pending');
      statusEl.classList.add(ok ? 'ok' : 'fail');
      statusEl.textContent = text;
    };
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sanitizeHeaderValue(apiKey) },
      body: JSON.stringify(body)
    };
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.Http) {
      window.Capacitor.Plugins.Http.request({
        method: 'POST',
        url: url,
        headers: opts.headers,
        data: body
      }).then(function (res) {
        var data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (res.status >= 400)
          done(false, (data.error && data.error.message ? data.error.message : '') || res.statusText || '请求失败');
        else
          done(true, '连接成功');
      }).catch(function (err) {
        done(false, friendlyFetchError(err));
      });
    } else {
      fetch(url, opts)
        .then(function (res) {
          if (!res.ok) return res.json().then(function (d) { throw new Error(d.error && d.error.message ? d.error.message : res.statusText); });
          return res.json();
        })
        .then(function () { done(true, '连接成功'); })
        .catch(function (err) { done(false, friendlyFetchError(err)); });
    }
  });

  function openDetail(id, fromReview) {
    currentDetailId = id;
    var list = loadQuestions();
    var q = list.find(function (x) { return x.id === id; });
    if (!q) return;
    var body = document.getElementById('modal-body');
    var aiResult = document.getElementById('modal-ai-result');
    aiResult.classList.add('hidden');
    aiResult.textContent = '';
    body.innerHTML =
      '<div class="detail-section"><span class="detail-label">学科</span><div class="detail-value">' + q.subject + '</div></div>' +
      (q.chapter ? '<div class="detail-section"><span class="detail-label">章节</span><div class="detail-value">' + escapeHtml(q.chapter) + '</div></div>' : '') +
      '<div class="detail-section"><span class="detail-label">题目</span><div class="detail-value">' + escapeHtml(q.question) + '</div></div>' +
      '<div class="detail-section"><span class="detail-label">错因类型</span><div class="detail-value">' + q.errorType + '</div></div>' +
      (q.knowledge ? '<div class="detail-section"><span class="detail-label">知识点</span><div class="detail-value">' + escapeHtml(q.knowledge) + '</div></div>' : '') +
      (q.cause ? '<div class="detail-section"><span class="detail-label">错因简述</span><div class="detail-value">' + escapeHtml(q.cause) + '</div></div>' : '') +
      (q.solution ? '<div class="detail-section"><span class="detail-label">正确思路</span><div class="detail-value">' + escapeHtml(q.solution) + '</div></div>' : '') +
      '<div class="detail-section"><span class="detail-label">难度</span><div class="detail-value">' + q.difficulty + '</div></div>' +
      (q.nextReviewDate ? '<div class="detail-section"><span class="detail-label">下次复习日</span><div class="detail-value">' + q.nextReviewDate + '</div></div>' : '');
    var modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    var level = q.reviewLevel || 0;
    document.getElementById('btn-done-review').style.display = level >= REVIEW_INTERVALS.length ? 'none' : 'block';

    document.getElementById('btn-delete').onclick = function () {
      if (!confirm('确定删除这道错题？')) return;
      var list = loadQuestions().filter(function (x) { return x.id !== id; });
      saveQuestions(list);
      modal.classList.add('hidden');
      renderList();
      renderReview();
      renderStats();
    };
    document.getElementById('btn-done-review').onclick = function () {
      q.lastReviewDate = todayStr();
      q.reviewLevel = (q.reviewLevel || 0) + 1;
      q.nextReviewDate = getNextReviewDate(q.reviewLevel) || null;
      var list = loadQuestions().map(function (x) { return x.id === id ? q : x; });
      saveQuestions(list);
      modal.classList.add('hidden');
      renderList();
      renderReview();
      renderStats();
    };

    var btnAi = document.getElementById('btn-ai-parse');
    btnAi.onclick = function () { runAiParse(q); };
  }

  function runAiParse(q) {
    var settings;
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      settings = raw ? JSON.parse(raw) : {};
    } catch (_) { settings = {}; }
    var apiKey = (settings.apiKey || '').trim();
    if (!apiKey) {
      alert('请先在「设置」里填写 API Key');
      return;
    }
    var provider = settings.provider || 'deepseek';
    var sysPrompt = '你是一位初中（初二）辅导老师，擅长语文、数学、英语、历史、道法、物理。请针对学生的一道错题做简明解析，包括：1）题目考查的知识点；2）常见错误原因；3）正确思路或解法要点；4）一句巩固建议。语言简洁，适合初二学生理解。';
    var userContent = '【学科】' + q.subject + '\n【章节】' + (q.chapter || '未填') + '\n【题目】' + (q.question || '') + '\n【学生自述错因】' + (q.errorType || '') + (q.cause ? '\n' + q.cause : '') + '\n请给出错题解析。';
    var url, model, body;
    if (provider === 'doubao') {
      url = DOUBAO_API;
      model = (settings.doubaoModel || 'doubao-pro-32k').trim() || 'doubao-pro-32k';
      body = { model: model, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userContent }], max_tokens: 1024 };
    } else {
      url = DEEPSEEK_API;
      model = 'deepseek-chat';
      body = { model: model, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userContent }], max_tokens: 1024, temperature: 0.3 };
    }
    var resultEl = document.getElementById('modal-ai-result');
    var btnAi = document.getElementById('btn-ai-parse');
    resultEl.classList.remove('hidden');
    resultEl.classList.add('loading');
    resultEl.textContent = '正在请求 AI 解析…';
    btnAi.disabled = true;
    function showResult(text) {
      resultEl.classList.remove('loading');
      resultEl.textContent = text;
      btnAi.disabled = false;
    }
    function showErr(err) {
      resultEl.classList.remove('loading');
      resultEl.textContent = '解析失败：' + friendlyFetchError(err);
      btnAi.disabled = false;
    }
    function parseResponse(data) {
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content : (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    }
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.Http) {
      window.Capacitor.Plugins.Http.request({
        method: 'POST',
        url: url,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sanitizeHeaderValue(apiKey) },
        data: body
      }).then(function (res) {
        var data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (res.status >= 400) throw new Error(res.status + ' ' + (data.error && data.error.message ? data.error.message : res.statusText));
        showResult(parseResponse(data));
      }).catch(showErr);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sanitizeHeaderValue(apiKey) },
        body: JSON.stringify(body)
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        return res.json();
      }).then(function (data) { showResult(parseResponse(data)); }).catch(showErr);
    }
  }

  document.querySelector('.modal-backdrop').addEventListener('click', function () {
    document.getElementById('modal').classList.add('hidden');
  });
  document.querySelector('.modal-close').addEventListener('click', function () {
    document.getElementById('modal').classList.add('hidden');
  });

  // ---------- 初始化 ----------
  renderList();
})();
