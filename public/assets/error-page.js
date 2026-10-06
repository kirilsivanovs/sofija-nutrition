const translations = {
  lv: {
    title: 'Serviss īslaicīgi nepieejams',
    message:
      'Atvainojamies par sagādātajām neērtībām. Mūsu sistēma pašlaik tiek atjaunināta. Lūdzu, mēģiniet vēlāk vai sazinieties ar mums pa e-\u2060pastu.',
    emailText: 'Rakstīt e-\u2060pastu',
    retryText: '↻ Mēģināt vēlreiz',
    specialtyText: 'Uztura speciāliste',
    footerText: 'Sofija Ivanova · Uztura speciāliste',
  },
  en: {
    title: 'Service Temporarily Unavailable',
    message:
      'We apologize for the inconvenience. Our system is currently being updated. Please try again later or contact us via email.',
    emailText: 'Send Email',
    retryText: '↻ Try Again',
    // pending Sofija, same status as header_specialty in main.js
    specialtyText: 'Nutrition Specialist',
    footerText: 'Sofija Ivanova · Nutrition Specialist',
  },
  ru: {
    title: 'Сервис временно недоступен',
    message:
      'Приносим извинения за неудобства. Наша система обновляется. Пожалуйста, попробуйте позже или свяжитесь с нами по электронной почте.',
    emailText: 'Написать письмо',
    retryText: '↻ Попробовать снова',
    // pending Sofija, same status as header_specialty in main.js
    specialtyText: 'Специалист по питанию',
    footerText: 'Софья Иванова · Специалист по питанию',
  },
};

function setLang(lang) {
  const t = translations[lang] || translations.lv;

  document.getElementById('title').textContent = t.title;
  document.getElementById('message').textContent = t.message;
  document.getElementById('email-text').textContent = t.emailText;
  document.getElementById('retry-text').textContent = t.retryText;
  document.getElementById('specialty-text').textContent = t.specialtyText;
  document.getElementById('footer-text').textContent = t.footerText;
  document.documentElement.lang = lang;

  // Update active button
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent === lang.toUpperCase());
  });

  // Save preference
  localStorage.setItem('preferredLang', lang);
}

// Load saved language
const savedLang = localStorage.getItem('preferredLang') || 'lv';
setLang(savedLang);

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});
document.getElementById('retry-btn').addEventListener('click', () => location.reload());
