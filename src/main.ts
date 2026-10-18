import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { Game } from './game/game';
const root=document.querySelector<HTMLElement>('#app')!;
try {
 const game=new Game(root);
 let updateSW:((reloadPage?:boolean)=>Promise<void>)|undefined;
 updateSW=registerSW({immediate:true,onNeedRefresh(){game.notifyUpdate(()=>void updateSW?.(true));},onRegisteredSW(_url,registration){if(registration)window.setInterval(()=>{if(navigator.onLine)void registration.update();},60*60*1000);}});
} catch(error) {
 console.error(error);
 root.innerHTML='<main class="panel" style="margin:10vh auto"><h1>The adventure needs a little help</h1><p>Your browser could not start 3D graphics. Close a few other tabs, then try again in Safari or Chrome.</p><button class="primary-button" id="retry">Try again</button></main>';
 document.querySelector('#retry')!.addEventListener('click',()=>location.reload());
}
