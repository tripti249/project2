/*
   Motivation widget logic
   - Draggable floating button
   - Speaker shortcuts
   - Mobile-friendly placement
*/

const motivationalSpeakers = [
  { name: 'Sandeep Maheshwari', icon: '\u{1F399}\u{FE0F}', url: 'https://www.youtube.com/@SandeepSeminars' },
  { name: 'Dr. Vivek Bindra', icon: '\u{1F4C8}', url: 'https://www.youtube.com/@MrVivekBindra' },
  { name: 'Sonu Sharma', icon: '\u{1F4A1}', url: 'https://www.youtube.com/@SONUSHARMAMotivation' },
  { name: 'Harshvardhan Jain', icon: '\u{1F525}', url: 'https://www.youtube.com/@HarshvardhanJain' }
];

function initMotivationWidget() {
  const widget = document.getElementById('motivation-widget');
  const mainBtn = document.getElementById('motivation-main-btn');
  const itemsContainer = document.getElementById('motivation-items');

  if (!widget || !mainBtn || !itemsContainer) return;

  let isOpen = false;
  let isDragging = false;
  let dragMoved = false;
  let pointerId = null;
  let offsetX = 0;
  let offsetY = 0;

  function isMobileLayout() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function updateMainButtonIcon() {
    mainBtn.textContent = isOpen ? '\u2715' : '\u2728';
    mainBtn.setAttribute('aria-label', isOpen ? 'Close motivational speakers' : 'Open motivational speakers');
  }

  function positionSpeakerItems() {
    const radius = isMobileLayout() ? 72 : 80;
    const items = itemsContainer.querySelectorAll('.motivation-item');
    const total = items.length;

    items.forEach((item, index) => {
      let angle;

      if (isMobileLayout()) {
        const start = -Math.PI / 3;
        const end = Math.PI / 3;
        angle = total === 1 ? 0 : start + ((end - start) * index) / (total - 1);
      } else {
        angle = (index / total) * (Math.PI * 2);
      }

      item.style.setProperty('--tx', `${Math.cos(angle) * radius}px`);
      item.style.setProperty('--ty', `${Math.sin(angle) * radius}px`);
    });
  }

  function clampPosition(left, top) {
    const size = widget.offsetWidth || 60;
    const padding = 12;

    return {
      left: Math.max(padding, Math.min(left, window.innerWidth - size - padding)),
      top: Math.max(padding, Math.min(top, window.innerHeight - size - padding)),
    };
  }

  function moveWidget(left, top) {
    const next = clampPosition(left, top);
    widget.style.left = `${next.left}px`;
    widget.style.top = `${next.top}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  }

  motivationalSpeakers.forEach((speaker) => {
    const item = document.createElement('a');
    item.href = speaker.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.className = 'motivation-item';
    item.title = speaker.name;
    item.innerHTML = `<span>${speaker.icon}</span>`;
    itemsContainer.appendChild(item);
  });

  positionSpeakerItems();
  updateMainButtonIcon();

  mainBtn.addEventListener('click', (event) => {
    if (dragMoved) {
      event.preventDefault();
      dragMoved = false;
      return;
    }

    isOpen = !isOpen;
    widget.classList.toggle('open', isOpen);
    updateMainButtonIcon();
  });

  mainBtn.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    isDragging = true;
    dragMoved = false;
    pointerId = event.pointerId;

    const rect = widget.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    widget.style.transition = 'none';
    if (typeof mainBtn.setPointerCapture === 'function') {
      mainBtn.setPointerCapture(event.pointerId);
    }
  });

  mainBtn.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== pointerId) return;

    const nextLeft = event.clientX - offsetX;
    const nextTop = event.clientY - offsetY;

    if (Math.abs(nextLeft - widget.offsetLeft) > 3 || Math.abs(nextTop - widget.offsetTop) > 3) {
      dragMoved = true;
    }

    moveWidget(nextLeft, nextTop);
  });

  function finishDrag(event) {
    if (!isDragging || (event && event.pointerId !== pointerId)) return;

    isDragging = false;
    widget.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

    if (pointerId !== null && typeof mainBtn.hasPointerCapture === 'function' && mainBtn.hasPointerCapture(pointerId)) {
      mainBtn.releasePointerCapture(pointerId);
    }

    pointerId = null;
  }

  mainBtn.addEventListener('pointerup', finishDrag);
  mainBtn.addEventListener('pointercancel', finishDrag);
  window.addEventListener('resize', positionSpeakerItems);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMotivationWidget);
} else {
  initMotivationWidget();
}
