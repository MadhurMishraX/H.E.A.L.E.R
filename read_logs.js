import fs from 'fs';
import path from 'path';

function getLogs() {
  const pm2Logs = '/root/.pm2/logs';
  try {
    const files = fs.readdirSync(pm2Logs);
    for (const file of files) {
      console.log(`\n\n--- ${file} ---`);
      const contents = fs.readFileSync(path.join(pm2Logs, file), 'utf8');
      console.log(contents.slice(-2000));
    }
  } catch(e) { }
}
getLogs();
