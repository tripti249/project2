/* ════════════════════════════════════════════════════════
   MOTIVATION WIDGET LOGIC
   - Draggable Floating Circle
   - 360-degree Orbiting Icons
   - YouTube Integration
   ════════════════════════════════════════════════════════ */

const motivationalSpeakers = [
  { name: 'Sandeep Maheshwari', icon: '🎙️', url: 'https://www.youtube.com/@SandeepSeminars' },
  { name: 'Dr. Vivek Bindra',   icon: '📈', url: 'https://www.youtube.com/@DrVivekBindra' },
  { name: 'Sonu Sharma',        icon: '💡', url: 'https://www.youtube.com/@sonusharmasocial' },
  { name: 'Harshvardhan Jain',  icon: '🔥', url: 'https://www.youtube.com/@HarshvardhanJain' }
];

function initMotivationWidget() {
  const widget = document.getElementById('motivation-widget');
  const mainBtn = document.getElementById('motivation-main-btn');
  const itemsContainer = document.getElementById('motivation-items');
  
  if (!widget || !mainBtn || !itemsContainer) return;

  let isOpen = false;

  // 1. Generate Speaker Items
  motivationalSpeakers.forEach((speaker, i) => {
    const angle = (i / motivationalSpeakers.length) * (Math.PI * 2);
    const radius = 80; // Distance from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const item = document.createElement('a');
    item.href = speaker.url;
    item.target = '_blank';
    item.className = 'motivation-item';
    item.title = speaker.name;
    item.innerHTML = `<span>${speaker.icon}</span>`;
    item.style.setProperty('--tx', `${x}px`);
    item.style.setProperty('--ty', `${y}px`);
    
    itemsContainer.appendChild(item);
  });

  // 2. Toggle Open/Close
  mainBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    widget.classList.toggle('open', isOpen);
    mainBtn.innerHTML = isOpen ? '✕' : '✨';
  });

  // 3. Make Draggable
  let isDragging = false;
  let offsetX, offsetY;

  mainBtn.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - widget.offsetLeft;
    offsetY = e.clientY - widget.offsetTop;
    widget.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Boundary checks (keep in viewport)
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    
    widget.style.left = `${Math.max(20, Math.min(x, maxX))}px`;
    widget.style.top = `${Math.max(20, Math.min(y, maxY))}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    widget.style.transition = 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
  });
}

// Global initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMotivationWidget);
} else {
  initMotivationWidget();
}
