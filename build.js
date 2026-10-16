#!/usr/bin/env node
// Build script : minifie HTML, CSS, JS → remplace les fichiers en place
const { minify: minifyHTML } = require('html-minifier-terser');
const { minify: minifyJS }   = require('terser');
const CleanCSS               = require('clean-css');
const fs                     = require('fs');

async function build() {
    // ── CSS ──
    const cssInput = fs.readFileSync('style.source.css', 'utf8');
    const cssResult = new CleanCSS({ level: 1 }).minify(cssInput);
    fs.writeFileSync('style.css', cssResult.styles);
    console.log(`CSS  : ${(cssInput.length/1024).toFixed(1)}KB → ${(cssResult.styles.length/1024).toFixed(1)}KB`);

    // ── JS ──
    const jsInput = fs.readFileSync('script.source.js', 'utf8');
    const jsResult = await minifyJS(jsInput, { compress: true, mangle: true });
    fs.writeFileSync('script.js', jsResult.code);
    console.log(`JS   : ${(jsInput.length/1024).toFixed(1)}KB → ${(jsResult.code.length/1024).toFixed(1)}KB`);

    // ── JS easter egg (coin mosaïque + bonhomme) ──
    for (const name of ['mosaique', 'bonhomme']) {
        const input = fs.readFileSync(`${name}.source.js`, 'utf8');
        const result = await minifyJS(input, { compress: true, mangle: true });
        fs.writeFileSync(`${name}.js`, result.code);
        console.log(`JS   : ${name} ${(input.length/1024).toFixed(1)}KB → ${(result.code.length/1024).toFixed(1)}KB`);
    }

    // ── Inject SVG icons (remplace Bootstrap Icons) ──
    require('./inject-icons.js');

    const htmlOptions = {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        useShortDoctype: true,
    };

    // ── HTML FR ──
    const htmlInput = fs.readFileSync('index.html', 'utf8');
    const htmlResult = await minifyHTML(htmlInput, htmlOptions);
    fs.writeFileSync('index.html', htmlResult);
    console.log(`HTML : ${(htmlInput.length/1024).toFixed(1)}KB → ${(htmlResult.length/1024).toFixed(1)}KB`);

    // ── HTML EN ──
    if (fs.existsSync('en/index.html')) {
        const htmlENInput = fs.readFileSync('en/index.html', 'utf8');
        const htmlENResult = await minifyHTML(htmlENInput, htmlOptions);
        fs.writeFileSync('en/index.html', htmlENResult);
        console.log(`HTML EN: ${(htmlENInput.length/1024).toFixed(1)}KB → ${(htmlENResult.length/1024).toFixed(1)}KB`);
    }
    // ── CSP : empreinte sha256 des scripts inline (choix de la photo selon le thème) ──
    const crypto = require('crypto');
    for (const f of ['index.html', 'en/index.html']) {
        if (!fs.existsSync(f)) continue;
        let h = fs.readFileSync(f, 'utf8');
        const hashes = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)]
            .map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
        h = h.replace(/script-src [^;]*;/, `script-src 'self' ${[...new Set(hashes)].join(' ')};`);
        fs.writeFileSync(f, h);
        console.log(`CSP  : ${f} ${hashes.length} script(s) inline hashé(s)`);
    }
}

build().catch(console.error);
