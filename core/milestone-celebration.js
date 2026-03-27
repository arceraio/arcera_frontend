/* ── Milestone Celebration Module ───────────────────────────────── */

const MILESTONES = [25, 50, 75, 100];
const STORAGE_KEY = 'arcera_milestone_seen';

// Check if milestone was already celebrated
function hasSeenMilestone(milestone) {
  const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return !!seen[milestone];
}

// Mark milestone as seen
function markMilestoneSeen(milestone) {
  const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  seen[milestone] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

// Create confetti canvas overlay
function createConfetti() {
  const canvas = document.createElement('canvas');
  canvas.className = 'milestone-confetti';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#C9A84C', '#059669', '#0D1B2A', '#F59E0B', '#EF4444'];
  
  // Create particles
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 5 + 3,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    });
  }
  
  let animationId;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      p.rotation += p.rotationSpeed;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      
      // Reset particle when it falls off screen
      if (p.y > canvas.height) {
        p.y = -p.size;
        p.x = Math.random() * canvas.width;
      }
    });
    
    animationId = requestAnimationFrame(animate);
  }
  
  animate();
  
  // Stop after 3 seconds
  setTimeout(() => {
    cancelAnimationFrame(animationId);
    canvas.remove();
  }, 3000);
}

// Show celebration modal
function showCelebrationModal(milestone) {
  const messages = {
    25: "You're on your way! Keep documenting your home.",
    50: "Halfway there! Your inventory is looking great.",
    75: "Almost ready! Just a bit more to reach export status.",
    100: "🎉 Perfect! Your inventory is claim-ready!"
  };
  
  const overlay = document.createElement('div');
  overlay.className = 'milestone-overlay open';
  overlay.innerHTML = `
    <div class="milestone-modal" role="dialog" aria-modal="true" aria-labelledby="milestone-title">
      <div class="milestone-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 class="milestone-title" id="milestone-title">${milestone}% Complete!</h2>
      <p class="milestone-message">${messages[milestone] || 'Great progress!'}</p>
      <button class="milestone-cta" autofocus>Keep Going</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close on button click or Escape
  const closeBtn = overlay.querySelector('.milestone-cta');
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
  };
  
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function handleEscape(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handleEscape);
    }
  });
  
  // Auto-close after 5 seconds
  setTimeout(close, 5000);
}

// Check and celebrate milestone
export function checkMilestone(readinessScore) {
  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  // Find highest milestone reached
  const reachedMilestone = MILESTONES.filter(m => readinessScore >= m).pop();
  if (!reachedMilestone) return;
  
  // Skip if already celebrated
  if (hasSeenMilestone(reachedMilestone)) return;
  
  // Celebrate!
  markMilestoneSeen(reachedMilestone);
  createConfetti();
  showCelebrationModal(reachedMilestone);
  
  // Analytics
  if (window._arceraAnalytics) {
    window._arceraAnalytics.push({
      event: 'milestone_reached',
      ts: Date.now(),
      milestone: reachedMilestone
    });
  }
}
