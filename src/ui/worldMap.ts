import { BIOMES, CREATURES, getBiome, type BiomeId } from '../game/data';
import type { SaveData } from '../game/progression';
import { icon } from './icons';

// Original miniature toy landscapes, drawn locally so the atlas also works offline.
const tree = (x: number, y: number, color = '#4f9667') =>
  `<path d="M${x} ${y}v24" stroke="#866047" stroke-width="7"/><path d="m${x - 22} ${y + 7} 22-37 22 37Z" fill="${color}"/><path d="m${x - 18} ${y - 6} 18-27 18 27Z" fill="${color}"/>`;
const palm = (x: number, y: number) =>
  `<path d="M${x - 5} ${y + 25}q12-20 5-43" fill="none" stroke="#ae7950" stroke-width="7"/><path d="M${x} ${y - 18}q-27-18-33 9 22-12 33-9Zm0 0q25-22 33 5-20-10-33-5Zm0 0q0-26 20-23-12 5-20 23Z" fill="#498f66"/>`;
const crystal = (x: number, y: number, color = '#bda7df') =>
  `<path d="m${x} ${y - 32} 12 16-4 28-17-7-5-24Z" fill="${color}"/><path d="m${x} ${y - 32} 2 39-11-2-5-24Z" fill="#ffffff" opacity=".3"/>`;

const scenes: Record<BiomeId, string> = {
  meadow: `<path d="M28 68q40-35 94-4" stroke="#f4de99" stroke-width="9" fill="none"/>${tree(55, 41)}${tree(109, 54, '#6aa879')}<g fill="#fff5ce"><circle cx="37" cy="69" r="4"/><circle cx="87" cy="70" r="4"/><circle cx="114" cy="79" r="4"/></g><g fill="#e6a072"><circle cx="37" cy="69" r="1.5"/><circle cx="87" cy="70" r="1.5"/></g>`,
  winter: `<path d="m18 66 31-44 27 38 23-48 33 54Z" fill="#f4fcf7"/>${tree(43, 54, '#82b2b1')}${tree(109, 62, '#82b2b1')}<path d="m24 54 19-29 19 29m27 7 20-30 20 30" fill="#f3fcf7"/><ellipse cx="76" cy="78" rx="18" ry="7" fill="#84c4cf"/>`,
  savannah: `<path d="M31 78q29-28 75-4" fill="none" stroke="#f3dc9c" stroke-width="8"/><path d="M64 68V36m0 14-19-10m19 2 19-13" stroke="#92774d" stroke-width="6" fill="none"/><path d="M27 34q3-13 22-11 14-20 30-7 24-5 32 16-35 17-84 2" fill="#739254"/><ellipse cx="116" cy="72" rx="16" ry="7" fill="#81bbc0"/>`,
  desert: `<path d="M17 73q22-42 48-2 26-45 66 1" fill="#e8bf7e"/><path d="M67 58V31h30v27m-30-17h30" stroke="#c49c6c" stroke-width="10" fill="none"/><path d="M37 73V44m0 15H26V48m11 7h11V38" stroke="#72a07a" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  beach: `<path d="M12 76q21-16 45-5t71-1" stroke="#7fc8cb" stroke-width="16" fill="none"/><path d="M15 70q21-13 45-5t65-1" stroke="#f4fcf2" stroke-width="4" fill="none"/>${palm(45, 39)}<path d="M98 71V43" stroke="#b08359" stroke-width="3"/><path d="M77 46q20-31 41 0Z" fill="#ec9a78"/><path d="M88 46q10-30 20 0" fill="#fff0ce"/><g fill="none" stroke="#eafff9" stroke-width="2"><circle cx="111" cy="23" r="6"/><circle cx="124" cy="39" r="4"/></g>`,
  ocean: `<path d="M10 68q15-12 30 0t30 0 30 0 30 0M22 82q15-12 30 0t30 0 30 0" stroke="#cfefde" stroke-width="3" fill="none"/><path d="M52 69V35m32 34V35m-39 0h46l-23-17Z" stroke="#e3e2bd" stroke-width="8" fill="#f4eaca"/><path d="M109 78V58m0 8-10-8m10 3 9-11" stroke="#d9989c" stroke-width="5" fill="none"/><g stroke="#f0fff6" fill="none" stroke-width="2"><circle cx="33" cy="32" r="6"/><circle cx="111" cy="30" r="4"/></g>`,
  volcano: `<path d="m22 77 32-58h33l38 58Z" fill="#9c7b6b"/><path d="m44 38 10-19h33l15 23-20-5-10 14-12-17Z" fill="#ffbd83"/><path d="m71 42 8 20-11 17" stroke="#efaa72" stroke-width="7" fill="none"/><g fill="#f6dec1"><circle cx="65" cy="9" r="8"/><circle cx="85" cy="3" r="6"/></g>`,
  underground: `<path d="M19 75V48q49-65 112 0v27" fill="#8c88a0"/><path d="M48 77V55q25-32 49 0v22" fill="#515b70"/>${crystal(41, 65, '#abc6c5')}${crystal(106, 78)}<path d="M70 80V62" stroke="#ead9b6" stroke-width="5"/><path d="M58 64q12-22 24 0Z" fill="#dc9da3"/>`,
  rifts: `<path d="m28 71 37-12 55 12-45 19Z" fill="#777e91"/><path d="m28 71 37-12 55 12-45 6Z" fill="#afa5bb"/>${crystal(51, 65)}${crystal(102, 75, '#9ec8bd')}<ellipse cx="76" cy="39" rx="17" ry="24" stroke="#f1d391" stroke-width="7" fill="#827d9f"/><path d="m75 24 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#ded7e6"/>`,
  city: `<path d="M23 79h105" stroke="#efddaa" stroke-width="11"/><path d="M29 72V36h24v36m10 0V16h27v56m10 0V42h23v30" fill="#e9d9b6" stroke="#719a98" stroke-width="3"/><path d="M71 27h10m-10 13h10m-10 13h10M36 45h10m-10 13h10m61-6h9m-9 11h9" stroke="#88b3b0" stroke-width="6"/>${tree(24, 64, '#6c9f78')}`,
};

function landscape(id: BiomeId, color: string) {
  return `<svg class="map-landscape" viewBox="0 0 150 100" aria-hidden="true"><ellipse cx="75" cy="83" rx="66" ry="13" fill="#4d999c" opacity=".18"/><path d="M10 64q-2-25 30-28 26-21 61-3 35 0 39 31 7 26-54 29-76 0-76-29" fill="${color}" stroke="#fff5d9" stroke-width="3"/>${scenes[id]}</svg>`;
}

export function worldMap(save: SaveData, current: BiomeId) {
  const remaining = CREATURES.filter((c) => !save.rescued.includes(c.id)).length;
  return `<div class="map-summary"><p>You're in <strong>${getBiome(current).name}</strong></p><span>${icon('paw', 18)} ${remaining ? `${remaining} ${remaining === 1 ? 'friend' : 'friends'} still waiting` : `All ${CREATURES.length} friends rescued!`}</span></div>
    <p class="map-help">Tap a place you've visited to travel. Find glowing rings to explore somewhere new.</p>
    <div class="map-atlas" aria-label="Places and animals to rescue">${BIOMES.map((biome) => {
      const pending = CREATURES.filter(
        (c) => c.biome === biome.id && !save.rescued.includes(c.id),
      ).length;
      const progress = pending
        ? `${pending} ${pending === 1 ? 'friend' : 'friends'} to rescue`
        : 'All friends rescued';
      const here = biome.id === current;
      const visited = save.discovered.includes(biome.id);
      return `<button class="map-stop ${here ? 'map-current' : ''}" data-travel="${biome.id}" data-current="${here}" ${here ? 'aria-current="location"' : ''} ${visited ? '' : 'disabled'}>
        <span class="map-place-status">${here ? `${icon('paw', 13)} You are here` : visited ? 'Tap to visit' : 'Find a glowing ring'}</span>
        ${landscape(biome.id, biome.color)}<strong>${biome.name}</strong><small class="map-pending">${pending ? icon('paw', 14) : icon('check', 14)} ${progress}</small>
      </button>`;
    }).join(
      '',
    )}<svg class="map-compass" viewBox="0 0 40 48" aria-hidden="true"><text x="20" y="9" text-anchor="middle" fill="currentColor" font-size="9">N</text><path d="m20 14 6 15-6 12-6-12Z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m20 14 6 15h-6Z" fill="currentColor"/></svg></div>
    <button id="home-button" class="secondary-button">${icon('home', 20)} Return to Meadow</button>`;
}
