#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const { evaluateModel, parseIngredientResponse, promotionDecision } = require('./scoring.cjs');

require.extensions['.ts'] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const {
  buildMealVisionPrompt,
  MEAL_VISION_PROMPT_VERSION,
} = require('../../functions/_shared/meals/vision.ts');

function readArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) continue;
    const key = argv[index].slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : 'true';
    args[key] = value;
  }
  return args;
}

async function imageBase64(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`image_http_${response.status}`);
  return Buffer.from(await response.arrayBuffer()).toString('base64');
}

async function runSample({ baseUrl, model, prompt, sample, image }) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [{ role: 'user', content: prompt, images: [image] }],
      }),
    });
    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      const errorCode =
        response.status === 403 && /subscription/i.test(responseText)
          ? 'ollama_subscription_required'
          : `ollama_http_${response.status}`;
      throw new Error(errorCode);
    }
    const body = await response.json();
    const content =
      typeof body.message?.content === 'string' ? body.message.content : body.response;
    const predicted = parseIngredientResponse(content);
    return {
      id: sample.id,
      expected: sample.expected,
      predicted: predicted ?? [],
      schemaValid: predicted !== null,
      succeeded: true,
      latencyMs: Math.round(performance.now() - startedAt),
      ...(predicted === null ? { error: 'invalid_schema' } : {}),
    };
  } catch (error) {
    return {
      id: sample.id,
      expected: sample.expected,
      predicted: [],
      schemaValid: false,
      succeeded: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'unknown_error',
    };
  }
}

async function main() {
  const args = readArguments(process.argv.slice(2));
  const datasetPath = path.resolve(args.dataset ?? path.join(__dirname, 'dataset.json'));
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  if (dataset.promptVersion !== MEAL_VISION_PROMPT_VERSION) {
    throw new Error(
      `prompt_version_mismatch_${dataset.promptVersion}_${MEAL_VISION_PROMPT_VERSION}`,
    );
  }
  const limit = args.limit ? Math.max(1, Number(args.limit)) : dataset.samples.length;
  const samples = dataset.samples.slice(0, limit);
  const baseUrl = args['base-url'] ?? process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
  const selectedModels = args.models
    ? dataset.models.filter((model) => args.models.split(',').includes(model.id))
    : dataset.models;
  if (selectedModels.length < 2) throw new Error('benchmark_requires_baseline_and_challenger');

  const images = new Map();
  for (const sample of samples) {
    process.stdout.write(`Fetching ${sample.id}\n`);
    images.set(sample.id, await imageBase64(sample.imageUrl));
  }

  const modelResults = [];
  for (const model of selectedModels) {
    const sampleResults = [];
    for (const sample of samples) {
      process.stdout.write(`Running ${model.id} on ${sample.id}\n`);
      sampleResults.push(
        await runSample({
          baseUrl,
          model: model.id,
          prompt: buildMealVisionPrompt('en-ZA'),
          sample,
          image: images.get(sample.id),
        }),
      );
    }
    modelResults.push(
      evaluateModel({ model: model.id, usageTier: model.usageTier, samples: sampleResults }),
    );
  }

  const baseline = modelResults.find(
    (result) => dataset.models.find((model) => model.id === result.model)?.role === 'baseline',
  );
  const challenger = modelResults.find(
    (result) => dataset.models.find((model) => model.id === result.model)?.role === 'challenger',
  );
  const report = {
    benchmarkVersion: dataset.version,
    promptVersion: MEAL_VISION_PROMPT_VERSION,
    source: dataset.source,
    generatedAt: new Date().toISOString(),
    models: modelResults,
    decision: promotionDecision(baseline, challenger),
  };
  const outputPath = path.resolve(args.output ?? path.join(__dirname, 'latest-result.json'));
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        outputPath,
        decision: report.decision,
        models: modelResults.map(
          ({ model, f1, precision, recall, schemaValidity, successRate, latencyMs }) => ({
            model,
            f1,
            precision,
            recall,
            schemaValidity,
            successRate,
            latencyMs,
          }),
        ),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
