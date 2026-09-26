// Bundles index.html + styles.css + JS into one self-contained file: dist/fairsign.html
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let html = read("index.html");
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${read("styles.css")}\n</style>`);
for (const f of ["samples.js", "engine.js", "app.js"]) {
  html = html.replace(`<script src="${f}"></script>`, () => `<script>\n${read(f).replace(/<\/script/gi, "<\\/script")}\n</script>`);
}
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "fairsign.html"), html);
// Artifact variant: the host adds its own doctype/html/head/body wrapper
const frag = html
  .replace(/<!doctype html>\s*/i, "")
  .replace(/<html[^>]*>\s*/i, "").replace(/<\/html>\s*/i, "")
  .replace(/<head>\s*/i, "").replace(/<\/head>\s*/i, "")
  .replace(/<body>\s*/i, "").replace(/<\/body>\s*/i, "")
  .replace(/<meta charset[^>]*>\s*/i, "").replace(/<meta name="viewport"[^>]*>\s*/i, "");
fs.writeFileSync(path.join(root, "dist", "artifact.html"), frag);
console.log("Built dist/fairsign.html and dist/artifact.html");
