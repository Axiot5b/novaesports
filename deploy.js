import { execSync } from 'child_process';

console.log('🚀 Iniciando despliegue a Cloudflare Pages...');

try {
  // Construir la aplicación
  console.log('📦 Construyendo la aplicación...');
  execSync('npm run build', { stdio: 'inherit' });

  // Aplicar migraciones a D1
  console.log('🔄 Aplicando migraciones a la base de datos...');
  execSync('npx wrangler d1 execute lol_teams_db --file=./src/lib/migrations/0000_initial.sql --remote', { stdio: 'inherit' });
  execSync('npx wrangler d1 execute lol_teams_db --file=./src/lib/migrations/0001_teams_update.sql --remote', { stdio: 'inherit' });
  execSync('npx wrangler d1 execute lol_teams_db --file=./src/lib/migrations/0002_add_puuid.sql --remote', { stdio: 'inherit' });

  // Desplegar a Cloudflare Pages
  console.log('🚀 Desplegando a Cloudflare Pages...');
  execSync('npx wrangler pages deploy dist --project-name nova-esports --branch main --commit-dirty=true --output-only=false', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN
    }
  });

  console.log('✅ ¡Despliegue completado con éxito!');
} catch (error) {
  console.error('❌ Error durante el despliegue:', error);
  process.exit(1);
}