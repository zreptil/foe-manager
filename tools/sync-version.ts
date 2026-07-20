import * as fs from 'fs';
import * as path from 'path';

const versionTsPath = path.join(__dirname, '../src/app/version.ts');
const packageJsonPath = path.join(__dirname, '../package.json');

function sync() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  const versionTsContent = `export const VERSION = '${version}';\n`;
  
  const currentContent = fs.existsSync(versionTsPath) ? fs.readFileSync(versionTsPath, 'utf8') : '';
  
  if (currentContent !== versionTsContent) {
    fs.writeFileSync(versionTsPath, versionTsContent);
    console.log(`Updated src/app/version.ts to version ${version}`);
  } else {
    console.log(`Version ${version} is already in sync.`);
  }
}

sync();
