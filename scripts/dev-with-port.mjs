// scripts/dev-with-port.mjs
import getPortModule from 'get-port';
import { spawn } from 'child_process';

async function startDev() {
  // Önce 3000 portunu dene, doluysa bir sonraki boş portu bul
  // get-port default export kullanıyor
  const getPort = getPortModule.default || getPortModule;
  const port = await getPort({ port: 3000 });
  
  console.log(`🚀 Port ${port}'te başlatılıyor...`);
  
  // Next.js dev server'ı başlat
  const nextDev = spawn('npx', ['next', 'dev', '-p', port.toString()], {
    stdio: 'inherit',
    shell: true
  });
  
  // Process temizleme
  process.on('SIGINT', () => {
    nextDev.kill();
    process.exit();
  });
  
  process.on('SIGTERM', () => {
    nextDev.kill();
    process.exit();
  });
}

startDev().catch(console.error);

