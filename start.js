process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./data.db';

const { execSync } = require('child_process');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma generate:', e.message);
  process.exit(1);
}

try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
} catch (e) {
  console.error('Erreur prisma db push:', e.message);
  process.exit(1);
}

require('./src/index.js');
