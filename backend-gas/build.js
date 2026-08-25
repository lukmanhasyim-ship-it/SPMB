const esbuild = require('esbuild');
const path = require('path');

try {
  esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'src', 'phone.js')],
    bundle: true,
    outfile: path.join(__dirname, 'PhoneLib.gs'),
    format: 'iife',
    globalName: 'PhoneLib',
    platform: 'node',
    target: 'es2017',
    minify: false,
    mainFields: ['main'],
  });
  console.log('PhoneLib.gs built successfully');
} catch (err) {
  console.error(err);
  process.exit(1);
}
