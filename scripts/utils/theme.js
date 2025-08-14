const THEME_KEY = 'themePreference'; // 'light' | 'dark' | 'system'
const mql = window.matchMedia('(prefers-color-scheme: dark)');

//Sets html class suffix based on theme
function setHtmlClass(theme) {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');

  if (theme === 'light') {
    html.classList.add('theme-light');
  } else if (theme === 'dark') {
    html.classList.add('theme-dark');
  } else {
    html.classList.add(mql.matches ? 'theme-dark' : 'theme-light'); //system default
  }

  window.dispatchEvent(new Event('themeChange'));
}

//Update Button Label
function updateButtonLabel(theme) {
  const btn = document.getElementById('themeToggle');
  const label = theme === 'light' ? 'Light'
               : theme === 'dark' ? 'Dark'
               : 'System';
  btn.textContent = `Theme: ${label}`;
  btn.setAttribute('aria-label', `Toggle theme (current: ${label})`);
}

//Local Storage for preference on reload
function applyThemeFromPreference() {
  const pref = localStorage.getItem(THEME_KEY) || 'system';
  setHtmlClass(pref);
  updateButtonLabel(pref);
  attachSystemListener(pref === 'system');
}

//System Theme Listener
function attachSystemListener(shouldAttach) {
  mql.removeEventListener('change', onSystemChange);
  if (shouldAttach) {
    mql.addEventListener('change', onSystemChange);
  }
}

function onSystemChange() {
  const pref = localStorage.getItem(THEME_KEY) || 'system';
  if (pref === 'system') {
    setHtmlClass('system');
  }
}

function nextTheme(current) {
  return current === 'light' ? 'dark'
       : current === 'dark'  ? 'system'
       : 'light';
}

// Init
applyThemeFromPreference();

// Single toggle cycles Light → Dark → System
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = localStorage.getItem(THEME_KEY) || 'system';
  const next = nextTheme(current);
  localStorage.setItem(THEME_KEY, next);
  setHtmlClass(next);
  updateButtonLabel(next);
  attachSystemListener(next === 'system');
});
