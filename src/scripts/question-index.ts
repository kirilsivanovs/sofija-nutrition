const LINE_RATIO = 0.4;

export function activeQuestionId(
  tops: { id: string; top: number }[],
  lineY: number
): string | null {
  let active: { id: string; top: number } | null = null;
  for (const entry of tops) {
    if (entry.top <= lineY && (active === null || entry.top > active.top)) active = entry;
  }
  return active ? active.id : null;
}

export function initQuestionIndex(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('#question-index-list a');
  if (!links.length) return;
  const sections = document.querySelectorAll<HTMLElement>('.question');

  const update = () => {
    const tops = Array.from(sections, (s) => ({ id: s.id, top: s.getBoundingClientRect().top }));
    const activeId = activeQuestionId(tops, window.innerHeight * LINE_RATIO);
    links.forEach((a) => {
      if (activeId !== null && a.getAttribute('href') === '#' + activeId) {
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };

  // Zero-height line at 40%: fires on every section top crossing it.
  const observer = new IntersectionObserver(update, { rootMargin: '-40% 0px -60% 0px' });
  sections.forEach((s) => observer.observe(s));
  // The hero covers the line at the top, so scrolling back up triggers update() with no active link.
  const hero = document.getElementById('hero');
  if (hero) observer.observe(hero);
  window.addEventListener('scrollend', update);
  update();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href') ?? '');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
}
