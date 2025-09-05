// assets/script.js
// Dynamically load translations from assets/translations.js if available.
// Provide a minimal safe fallback if the translations file can't be loaded.

(function () {
  'use strict';

  // Fallback translations in case assets/translations.js isn't loaded
  const fallbackTranslations = {
    en: {
      orgDescription: `<h2>FinoGeeks</h2><p>Building an autonomous and open digital ecosystem with enterprise-grade, cloud-native mobile app engines.</p>`,
      learnMore: "Learn more about our products at <a href='https://www.finclip.com'>FinClip</a>.",
      contact: 'Contact us at 400-066-0021 or 0755-86967467 for business inquiries.'
    },
    zh: {
      orgDescription: `<h2>凡泰极客</h2><p>以企业级云原生移动应用数字引擎构建自主开放的数字生态。</p>`,
      learnMore: "访问 <a href='https://www.finclip.com'>FinClip</a> 了解更多产品信息。",
      contact: '商务洽谈请致电 400-066-0021 或 0755-86967467。'
    }
  };

  // Attempt to load translations.js; resolve whether it loads or not
  function loadTranslations() {
    return new Promise((resolve) => {
      if (window.translations) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'assets/translations.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve(); // proceed with fallback
      document.head.appendChild(script);
    });
  }

  function getTranslations() {
    return window.translations || fallbackTranslations;
  }

  // Update language and content
  function setLanguage(lang) {
    const t = getTranslations();
    const safeLang = t[lang] ? lang : 'en';
    localStorage.setItem('preferredLanguage', safeLang);
    document.documentElement.lang = safeLang;

    const content = [
      t[safeLang].orgDescription,
      `<p>${t[safeLang].learnMore}</p>`,
      `<p>${t[safeLang].contact}</p>`
    ].join('');

    const container = document.getElementById('org-description');
    if (container) container.innerHTML = content;

    // Update language switcher button state (if present)
    const switcher = document.getElementById('language-switcher');
    if (switcher) {
      const buttons = switcher.querySelectorAll('button');
      buttons.forEach(btn => {
        const isActive = btn.getAttribute('onclick')?.includes(`'${safeLang}'`);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
  }

  // Expose to global scope for HTML inline onclick handlers
  window.setLanguage = setLanguage;

  // Fetch and render GitHub repositories
  async function fetchRepos() {
    const repoList = document.getElementById('repo-list');
    if (!repoList) return;

    // Loading state
    repoList.innerHTML = '<li>Loading repositories…</li>';

    const url = 'https://api.github.com/orgs/finogeeks/repos?per_page=100&sort=updated';
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github+json'
        }
      });

      if (!response.ok) {
        // GitHub API often rate limits unauthenticated requests
        const message = response.status === 403 ?
          'Rate limit exceeded. Please try again later.' :
          `Failed to load repositories (HTTP ${response.status}).`;
        repoList.innerHTML = `<li>${message}</li>`;
        return;
      }

      const repos = await response.json();
      // Filter out forks/archived for clarity
      const visible = repos
        .filter(r => !r.fork && !r.archived)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      if (!visible.length) {
        repoList.innerHTML = '<li>No repositories to display.</li>';
        return;
      }

      const frag = document.createDocumentFragment();
      visible.forEach(repo => {
        const li = document.createElement('li');
        const desc = repo.description || 'No description';
        const stars = typeof repo.stargazers_count === 'number' ? ` ⭐ ${repo.stargazers_count}` : '';
        li.innerHTML = `<a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>: ${desc}${stars}`;
        frag.appendChild(li);
      });
      repoList.innerHTML = '';
      repoList.appendChild(frag);
    } catch (error) {
      console.error('Error fetching repos:', error);
      repoList.innerHTML = '<li>Error loading repositories. Please check your network.</li>';
    }
  }

  // Detect language based on user preference then browser settings
  function detectLanguage() {
    const preferred = localStorage.getItem('preferredLanguage');
    if (preferred) {
      setLanguage(preferred);
      return;
    }

    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (browserLang.startsWith('zh')) {
      setLanguage('zh');
    } else {
      setLanguage('en');
    }
  }

  // Initialize page
  document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    detectLanguage();
    fetchRepos();
  });
})();