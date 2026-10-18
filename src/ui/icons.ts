export function icon(name: string, size = 24) {
  const paths: Record<string, string> = {
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    paw: '<ellipse cx="12" cy="15" rx="6" ry="5"/><ellipse cx="5" cy="8" rx="2" ry="3"/><ellipse cx="10" cy="5" rx="2" ry="3"/><ellipse cx="16" cy="6" rx="2" ry="3"/><ellipse cx="20" cy="10" rx="2" ry="3"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    up: '<path d="m5 15 7-7 7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    sound: '<path d="m3 9 5 0 5-5v16l-5-5H3Zm14-2q6 5 0 10m-1-7q2 2 0 4"/>',
    heart: '<path d="M12 21 3.5 12.5A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 8.5 7.5Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.paw}</svg>`;
}
export function portrait(id: string, color: string) {
  if (id === 'human')
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#68a28b" d="M6 48V36q18-16 36 0v12"/><rect x="12" y="8" width="24" height="28" rx="9" fill="#f5caa3"/><path fill="#624b3f" d="M10 18V8q14-13 28 0v12l-7-8-11 5Z"/><path stroke="#324d48" stroke-width="3" d="M19 23h1m8 0h1"/></svg>';
  const flying = ['falcon', 'bat', 'glow-moth'].includes(id),
    sea = ['shark', 'piranha', 'barracuda', 'whale-shark', 'leviathan'].includes(id);
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="${sea ? 'M5 24 16 11 35 13 42 24 35 36 16 37Z' : flying ? 'M3 8 18 17 24 11 30 17 45 8 40 37 8 37Z' : 'M8 31 6 6 20 15 28 15 42 6 40 31 24 42Z'}" fill="${color}"/><path d="m13 30 11 10 11-10-11 3Z" fill="#fff2d8"/><path d="M16 24h1m14 0h1" stroke="#294a43" stroke-linecap="round" stroke-width="4"/><path d="m21 31 3 3 3-3Z" fill="#294a43"/></svg>`;
}
