import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const widgetDirectory = resolve(currentDirectory, './widget');

export function renderProjectGenerativeUIHtml(): string {
  const script = readFileSync(resolve(widgetDirectory, 'widget.js'), 'utf8');
  const stylesheet = readFileSync(
    resolve(widgetDirectory, 'widget.css'),
    'utf8'
  );

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${stylesheet}</style>
  </head>
  <body>
    <main id="app" aria-live="polite"></main>
    <script type="module">${script}</script>
  </body>
</html>`;
}
