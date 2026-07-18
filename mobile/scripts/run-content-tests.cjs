const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

require(path.resolve(__dirname, '../lib/contentLibrary.test.ts'));
require(path.resolve(__dirname, '../lib/spotify.test.ts'));
require(path.resolve(__dirname, '../lib/spotifyRecap.test.ts'));
require(path.resolve(__dirname, '../lib/homeExperience.test.ts'));
require(path.resolve(__dirname, '../lib/journal.test.ts'));
