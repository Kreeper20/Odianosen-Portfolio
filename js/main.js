function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => { toggle.classList.remove('open'); links.classList.remove('open'); })
    );
  }

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

function initScrollReveal() {
  const els = document.querySelectorAll('.fade-in');
  const rules = document.querySelectorAll('.section-rule');

  const obsEl = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obsEl.unobserve(e.target); } });
  }, { threshold: 0.12 });

  const obsRule = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate'); obsRule.unobserve(e.target); } });
  }, { threshold: 0.5 });

  els.forEach(el => obsEl.observe(el));
  rules.forEach(r => obsRule.observe(r));
}

function initSkillBars() {
  const bars = document.querySelectorAll('.skill-fill');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.width;
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => obs.observe(b));
}

function initPlanner() {
  if (!document.getElementById('planner-form')) return;

  let tasks = JSON.parse(localStorage.getItem('portfolio_tasks') || '[]');
  let filter = 'all';

  const form       = document.getElementById('planner-form');
  const taskTitle  = document.getElementById('task-title');
  const taskCourse = document.getElementById('task-course');
  const taskDue    = document.getElementById('task-due');
  const taskPri    = document.getElementById('task-priority');
  const listEl     = document.getElementById('task-list');
  const countEl    = document.getElementById('task-count');
  const totalEl    = document.getElementById('stat-total');
  const doneEl     = document.getElementById('stat-done');
  const pendEl     = document.getElementById('stat-pending');
  const filterBtns = document.querySelectorAll('.filter-btn');

  function save() { localStorage.setItem('portfolio_tasks', JSON.stringify(tasks)); }

  function render() {
    const filtered = tasks.filter(t => {
      if (filter === 'active')    return !t.done;
      if (filter === 'completed') return  t.done;
      return true;
    });

    listEl.innerHTML = '';
    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><p>${filter === 'completed' ? 'No completed tasks yet.' : 'No tasks here. Add one!'}</p></div>`;
    } else {
      filtered.forEach(t => listEl.appendChild(buildTaskEl(t)));
    }

    const done = tasks.filter(t => t.done).length;
    countEl.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;
    totalEl.textContent = tasks.length;
    doneEl.textContent  = done;
    pendEl.textContent  = tasks.length - done;
  }

  function buildTaskEl(t) {
    const li = document.createElement('div');
    li.className = `task-item${t.done ? ' completed' : ''}`;
    li.dataset.id       = t.id;
    li.dataset.priority = t.priority;

    const checkIcon = t.done ? '✓' : '';
    const dueStr    = t.due ? ` ${t.due}` : '';

    li.innerHTML = `
      <button class="task-check" data-id="${t.id}" title="Toggle complete" aria-label="Toggle task complete">${checkIcon}</button>
      <div class="task-content">
        <div class="task-title">${escHtml(t.title)}</div>
        <div class="task-meta">
          ${t.course ? `<span> ${escHtml(t.course)}</span>` : ''}
          ${dueStr ? `<span>${dueStr}</span>` : ''}
          <span><span class="priority-dot priority-${t.priority}"></span> ${capitalise(t.priority)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-danger" data-del="${t.id}" title="Delete task">✕</button>
      </div>`;

    li.querySelector('.task-check').addEventListener('click', () => toggleDone(t.id));
    li.querySelector('[data-del]').addEventListener('click', () => deleteTask(t.id));
    return li;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) { taskTitle.focus(); return; }

    const task = {
      id:       Date.now(),
      title,
      course:   taskCourse.value.trim(),
      due:      taskDue.value,
      priority: taskPri.value,
      done:     false,
    };
    tasks.unshift(task);
    save(); render();
    form.reset();
    taskTitle.focus();
  });

  function toggleDone(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    save(); render();
  }

  function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    tasks = tasks.filter(t => t.id !== id);
    save(); render();
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    });
  });

  render();
}

function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = {
    name:    { el: form.querySelector('#cf-name'),    err: form.querySelector('#err-name')    },
    email:   { el: form.querySelector('#cf-email'),   err: form.querySelector('#err-email')   },
    phone:   { el: form.querySelector('#cf-phone'),   err: form.querySelector('#err-phone')   },
    message: { el: form.querySelector('#cf-message'), err: form.querySelector('#err-message') },
  };
  const successMsg = document.getElementById('form-success');

  Object.values(fields).forEach(({ el }) => {
    el.addEventListener('input',  () => validateField(el));
    el.addEventListener('blur',   () => validateField(el));
  });

  function validateField(el) {
    const id  = el.id.replace('cf-', '');
    const val = el.value.trim();
    const err = fields[id]?.err;
    let msg = '';

    if (!val) {
      msg = 'This field is required.';
    } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = 'Please enter a valid email address.';
    } else if (id === 'phone' && !/^\d+$/.test(val)) {
      msg = 'Phone number must contain digits only.';
    } else if (id === 'message' && val.length < 10) {
      msg = 'Message must be at least 10 characters.';
    }

    if (err) { err.textContent = msg; err.classList.toggle('visible', !!msg); }
    el.classList.toggle('invalid', !!msg);
    el.classList.toggle('valid',   !msg && !!val);
    return !msg;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const valid = Object.values(fields).map(({ el }) => validateField(el)).every(Boolean);
    if (!valid) return;
    successMsg.classList.add('visible');
    form.reset();
    Object.values(fields).forEach(({ el }) => { el.classList.remove('valid', 'invalid'); });
    setTimeout(() => successMsg.classList.remove('visible'), 5000);
  });
}

function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      let current  = 0;
      const step   = target / 50;
      const timer  = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.round(current) + suffix;
      }, 30);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initSkillBars();
  initPlanner();
  initContact();
  initCounters();
});
