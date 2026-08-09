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

const testDirectory = path.resolve(__dirname, '../lib/forms');
for (const filename of fs.readdirSync(testDirectory).filter((name) => name.endsWith('.test.ts')).sort()) {
  require(path.join(testDirectory, filename));
}
