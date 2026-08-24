const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/app/daftar/page.tsx', 'utf8');

try {
  babel.parseSync(code, {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
    filename: 'page.tsx',
  });
  console.log('Parse successful!');
} catch (e) {
  console.error(e.message);
}
