import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({
  plugins:[react(),tailwind(),VitePWA({
    registerType:'autoUpdate',
    includeAssets:['icon.svg'],
    manifest:{name:'WORDLINGS — The Lost Worlds',short_name:'Wordlings',description:'A woodland English learning adventure',theme_color:'#123b35',background_color:'#123b35',display:'standalone',start_url:'/',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},
    workbox:{globPatterns:['**/*.{js,css,html,svg,woff2,wav,mp3,ogg,m4a,png,webp}'],globIgnores:['**/previews/**'],maximumFileSizeToCacheInBytes:5000000}
  })],
  build:{rollupOptions:{output:{manualChunks:{phaser:['phaser']}}}}
});
