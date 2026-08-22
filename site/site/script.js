// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if(toggle && links){
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// Scroll reveal (progressive enhancement — content is visible by default in HTML/CSS;
// JS only adds the hidden "pre" state right before it takes responsibility for revealing it)
const els = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  els.forEach(el => el.classList.add('pre'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
}

// ---------- helpers ----------
function fmtDate(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtDateShort(iso){
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------- Blog list ----------
const blogGrid = document.getElementById('blog-grid');
if(blogGrid){
  fetch('data/posts.json').then(r => r.json()).then(posts => {
    posts.sort((a,b) => new Date(b.date) - new Date(a.date));
    if(!posts.length){
      blogGrid.innerHTML = '<p class="empty-state">New posts are on the way — check back soon.</p>';
      return;
    }
    blogGrid.innerHTML = posts.map(p => `
      <a class="post-card reveal in" href="post.html?slug=${encodeURIComponent(p.slug)}">
        <div class="thumb"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
        <div class="post-body">
          <span class="post-date">${fmtDateShort(p.date)}</span>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <span class="readmore">Read more →</span>
        </div>
      </a>
    `).join('');
  }).catch(() => {
    blogGrid.innerHTML = `<p class="empty-state">Posts couldn't be loaded right now. If you're viewing this file locally, posts will load once the site is deployed.</p>`;
  });
}

// ---------- Single post ----------
const postRoot = document.getElementById('post-root');
if(postRoot){
  const slug = new URLSearchParams(window.location.search).get('slug');
  fetch('data/posts.json').then(r => r.json()).then(posts => {
    const post = posts.find(p => p.slug === slug);
    if(!post){
      postRoot.innerHTML = `<p class="empty-state">We couldn't find that post. <a href="blog.html">Back to the blog →</a></p>`;
      return;
    }
    document.title = post.title + ' | Integrative Rehabilitation & Wellness';
    postRoot.innerHTML = `
      <div class="post-hero reveal in">
        <span class="post-date">${fmtDate(post.date)}</span>
        <h1>${post.title}</h1>
        <p class="post-meta">By ${post.author}</p>
      </div>
      ${post.image ? `<div class="post-hero-image reveal in"><img src="${post.image}" alt="${post.title}"></div>` : ''}
      <div class="post-content reveal in" style="margin-top:44px;">${(window.marked ? marked.parse(post.body) : post.body)}</div>
    `;
  }).catch(() => {
    postRoot.innerHTML = `<p class="empty-state">This post couldn't be loaded right now. If you're viewing this file locally, it will load once the site is deployed.</p>`;
  });
}

// ---------- Events list + calendar ----------
const eventsList = document.getElementById('events-list');
const calGrid = document.getElementById('cal-grid');
if(eventsList || calGrid){
  fetch('data/events.json').then(r => r.json()).then(events => {
    events.sort((a,b) => new Date(a.date) - new Date(b.date));
    const upcoming = events.filter(e => new Date(e.date + 'T23:59:59') >= new Date(new Date().toDateString()));

    if(eventsList){
      eventsList.innerHTML = (upcoming.length ? upcoming : events).map(e => `
        <li class="event-item reveal in">
          <span class="event-date">${fmtDate(e.date)}${e.time ? ' · ' + e.time : ''}</span>
          <h3>${e.title}</h3>
          <p class="event-meta">${e.location || ''}</p>
          <p>${e.description || ''}</p>
          ${e.link ? `<a class="textlink" href="${e.link}" target="_blank" rel="noopener">Reserve a spot →</a>` : ''}
        </li>
      `).join('') || '<p class="empty-state">No events scheduled right now — check back soon.</p>';
    }

    if(calGrid){
      renderCalendar(new Date(), events);
    }
  }).catch(() => {
    if(eventsList) eventsList.innerHTML = `<p class="empty-state">Events couldn't be loaded right now. If you're viewing this file locally, they will load once the site is deployed.</p>`;
  });
}

// ---------- Services page (falls back to the static HTML already in the page) ----------
const servicesIntro = document.getElementById('services-intro');
if(servicesIntro){
  fetch('data/services.json').then(r => r.json()).then(s => {
    if(s.intro) servicesIntro.textContent = s.intro;
    const setText = (id, val) => { const el = document.getElementById(id); if(el && val) el.textContent = val; };
    const setList = (id, items) => {
      const el = document.getElementById(id);
      if(el && Array.isArray(items) && items.length){
        el.innerHTML = items.map(i => `<li>${i}</li>`).join('');
      }
    };
    setText('pt-heading', s.pt_heading);
    setText('pt-tag', s.pt_tag);
    setList('pt-list', s.pt_services);
    setText('wellness-heading', s.wellness_heading);
    setText('wellness-tag', s.wellness_tag);
    setList('wellness-list', s.wellness_services);
    setText('services-footnote', s.footnote);
  }).catch(() => { /* keep the default content already in the page */ });
}

// ---------- Testimonials (falls back to the static placeholder cards already in the page) ----------
const reviewsGrid = document.getElementById('reviews-grid');
if(reviewsGrid){
  fetch('data/testimonials.json').then(r => r.json()).then(t => {
    if(t.reviews && t.reviews.length){
      reviewsGrid.innerHTML = t.reviews.map(r => `
        <div class="review-card">
          <div class="stars">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
          <p class="quote">${r.quote}</p>
          <span class="author">${r.author}</span>
        </div>
      `).join('');
    }
    const link = document.getElementById('google-reviews-link');
    if(link && t.google_reviews_url) link.href = t.google_reviews_url;
  }).catch(() => { /* keep the default placeholder cards already in the page */ });
}

let calEventsCache = [];
function renderCalendar(viewDate, events){
  calViewDate = viewDate;
  calEventsCache = events;
  const dowRow = ['S','M','T','W','T','F','S'];
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toDateString();

  const eventDates = new Set(events.map(e => e.date));

  let cells = dowRow.map(d => `<div class="dow">${d}</div>`).join('');
  for(let i=0; i<firstDay; i++){ cells += '<div class="day empty"></div>'; }
  for(let d=1; d<=daysInMonth; d++){
    const cellDate = new Date(year, month, d);
    const iso = cellDate.toISOString().slice(0,10);
    const classes = ['day'];
    if(cellDate.toDateString() === todayStr) classes.push('today');
    if(eventDates.has(iso)) classes.push('has-event');
    cells += `<div class="${classes.join(' ')}" title="${eventDates.has(iso) ? 'Event scheduled' : ''}">${d}</div>`;
  }

  const label = document.getElementById('cal-month-label');
  const grid = document.getElementById('cal-grid');
  if(label) label.textContent = monthLabel;
  if(grid) grid.innerHTML = cells;
}
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
if(calPrev) calPrev.addEventListener('click', () => {
  const d = new Date(calViewDate); d.setMonth(d.getMonth() - 1);
  renderCalendar(d, calEventsCache);
});
if(calNext) calNext.addEventListener('click', () => {
  const d = new Date(calViewDate); d.setMonth(d.getMonth() + 1);
  renderCalendar(d, calEventsCache);
});
