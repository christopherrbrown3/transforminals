import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: '/',
  plugins: [VitePWA({
    registerType: 'prompt', injectRegister: false,
    includeAssets: ['icons/*.png', 'icons/*.svg', 'models/*.glb'],
    manifest: { name: 'Transforminals', short_name: 'Transforminals', description: 'Calvin’s creature rescue and transformation adventure.', theme_color: '#255d43', background_color: '#f8f1d9', display: 'standalone', orientation: 'landscape', start_url: '/', scope: '/', icons: [{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},
    workbox: {globPatterns:['**/*.{js,css,html,png,svg,woff2,glb}'], maximumFileSizeToCacheInBytes: 4*1024*1024, navigateFallback: 'index.html', cleanupOutdatedCaches:true},
    devOptions: {enabled: false}
  })],
  test: {include:['src/**/*.test.ts'], environment:'node'},
  build: {rollupOptions:{output:{manualChunks:(id:string)=>id.includes('/node_modules/three/')?'three':undefined}}}
});
