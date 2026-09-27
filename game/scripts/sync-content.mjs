import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export async function syncContent() {
  const destination = new URL('../dist/data.json', import.meta.url);
  await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
  await copyFile(new URL('../../data/prototype-content.json', import.meta.url), destination);
  return fileURLToPath(destination);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await syncContent());
