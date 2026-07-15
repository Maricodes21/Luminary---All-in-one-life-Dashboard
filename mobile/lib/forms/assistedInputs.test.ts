import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clampNumber, isFutureDate, stepNumber, suggestFromHistory, toLocalDateValue, uniqueChoices } from './assistedInputs';

test('number stepping respects bounds', () => {
  assert.equal(stepNumber(66, 0.5, 1, 20, 400), 66.5);
  assert.equal(stepNumber(20, 1, -1, 20, 400), 20);
  assert.equal(clampNumber(500, 20, 400), 400);
});

test('dates use local ISO values and reject future dates', () => {
  assert.equal(toLocalDateValue(new Date(2026, 6, 15)), '2026-07-15');
  assert.equal(isFutureDate('2026-07-16', '2026-07-15'), true);
});

test('choices and history suggestions are normalized', () => {
  assert.deepEqual(uniqueChoices([' Vegan ', 'vegan', 'Fish']), ['Vegan', 'Fish']);
  assert.deepEqual(suggestFromHistory('pi', ['Pick n Pay', 'Pizza Hut', 'Woolworths'], 4), ['Pick n Pay', 'Pizza Hut']);
});

const componentDirectory = resolve(__dirname, '../../components/ui');

function readComponentSource(filename: string) {
  return readFileSync(resolve(componentDirectory, filename), 'utf8');
}

test('shared assisted controls preserve their source contracts', () => {
  const dateField = readComponentSource('DateField.tsx');
  const choiceGroup = readComponentSource('ChoiceGroup.tsx');
  const multiChoiceField = readComponentSource('MultiChoiceField.tsx');
  const selectField = readComponentSource('SelectField.tsx');
  const numberField = readComponentSource('NumberField.tsx');
  const autocompleteField = readComponentSource('AutocompleteField.tsx');

  assert.match(dateField, /import\s+DateTimePicker(?:\s*,[^;]+)?\s+from\s+['"]@react-native-community\/datetimepicker['"]/);
  assert.match(dateField, /toLocalDateValue/);
  assert.match(numberField, /min\?:\s*number/);
  assert.match(numberField, /max\?:\s*number/);
  assert.match(numberField, /step\?:\s*number/);
  assert.match(numberField, /stepNumber/);
  assert.match(numberField, /clampNumber/);
  assert.match(numberField, /onBlur=\{commitValue\}/);
  assert.doesNotMatch(numberField, /accessibilityRole="adjustable"/);
  assert.match(selectField, /ActionSheet/);
  assert.match(multiChoiceField, /ScrollView/);
  assert.match(multiChoiceField, /horizontal/);
  assert.match(multiChoiceField, /height:\s*44/);
  assert.match(autocompleteField, /ScrollView/);
  assert.match(autocompleteField, /height:\s*120/);

  for (const source of [dateField, choiceGroup, multiChoiceField, selectField, numberField, autocompleteField]) {
    assert.match(source, /accessibility(?:Label|Role)/);
  }
});
