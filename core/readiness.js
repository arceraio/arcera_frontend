const EXPORT_THRESHOLD = 80;

export function calculateClaimReadiness(items) {
  if (!items || items.length === 0) return 0;
  
  const hasValue = items.filter(i => i.cost != null).length;
  const hasPhoto = items.filter(i => i.crop_url != null).length;
  const hasRoom = items.filter(i => i.room != null || i.room_id != null).length;
  
  const valueScore = (hasValue / items.length) * 40;
  const photoScore = (hasPhoto / items.length) * 40;
  const roomScore = (hasRoom / items.length) * 20;
  
  return Math.round(valueScore + photoScore + roomScore);
}

export function getReadinessLevel(score) {
  if (score >= 80) return { level: 'high', label: 'Ready to Export', color: 'var(--color-navy)' };
  if (score >= 50) return { level: 'medium', label: 'In Progress', color: 'var(--color-success)' };
  return { level: 'low', label: 'Needs Work', color: 'var(--color-warning-alt)' };
}

export function getExportRequirements(items) {
  const readiness = calculateClaimReadiness(items);
  if (readiness >= EXPORT_THRESHOLD) return { ready: true, itemsNeeded: 0 };
  const itemsNeeded = Math.ceil((EXPORT_THRESHOLD - readiness) / 33);
  return { ready: false, itemsNeeded: Math.max(1, itemsNeeded) };
}

export { EXPORT_THRESHOLD };
