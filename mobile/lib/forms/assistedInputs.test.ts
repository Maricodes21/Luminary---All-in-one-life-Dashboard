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
const appDirectory = resolve(__dirname, '../../app');

function readComponentSource(filename: string) {
  return readFileSync(resolve(componentDirectory, filename), 'utf8');
}

function readAppSource(filename: string) {
  return readFileSync(resolve(appDirectory, filename), 'utf8');
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
  assert.match(selectField, /valueContainer:\s*\{ flex:\s*1, minWidth:\s*0 \}/);
  assert.match(selectField, /numberOfLines=\{1\}/);
  assert.match(selectField, /ellipsizeMode="tail"/);
  assert.match(multiChoiceField, /ScrollView/);
  assert.match(multiChoiceField, /horizontal/);
  assert.match(multiChoiceField, /height:\s*44/);
  assert.match(autocompleteField, /ScrollView/);
  assert.match(autocompleteField, /height:\s*120/);

  for (const source of [dateField, choiceGroup, multiChoiceField, selectField, numberField, autocompleteField]) {
    assert.match(source, /accessibility(?:Label|Role)/);
  }
});

test('onboarding, settings, and health adopt assisted inputs without replacing credential text fields', () => {
  const profile = readAppSource('onboarding/profile.tsx');
  const body = readAppSource('onboarding/body.tsx');
  const settings = readAppSource('settings.tsx');
  const health = readAppSource('(tabs)/health.tsx');
  const account = readAppSource('onboarding/account.tsx');

  assert.match(profile, /import\s+\{[^}]*ChoiceGroup[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.doesNotMatch(profile, /MultiChoiceField/);
  assert.match(profile, /value:\s*'she\/her'/);
  assert.match(profile, /value:\s*'he\/him'/);
  assert.match(profile, /value:\s*'they\/them'/);
  assert.match(profile, /value:\s*'Custom'/);
  assert.match(profile, /useState<PronounChoice \| undefined>/);
  assert.match(profile, /if \(!pronouns\) return undefined;/);
  assert.match(profile, /value=\{pronounChoice \?\? ''\}/);
  assert.match(profile, /setPronounChoice\(choice \|\| undefined\)/);
  assert.match(profile, /pronounChoice === 'Custom'/);
  assert.match(profile, /accessibilityLabel="Custom pronouns, optional"/);
  assert.doesNotMatch(profile, /choices\[0\]/);
  assert.match(profile, /label:\s*\{/);
  assert.match(body, /import\s+\{\s*NumberField\s*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(body, /step=\{0\.5\}/);
  assert.match(body, /step=\{1\}/);
  assert.match(body, /<View style=\{styles\.measurementFields\}>/);
  assert.match(body, /measurementFields:\s*\{ gap:\s*spacing\.md \}/);
  assert.doesNotMatch(body, /row:\s*\{ flexDirection:\s*'row'/);
  assert.match(settings, /import\s+\{[^}]*ChoiceGroup[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(health, /import\s+\{[^}]*ChoiceGroup[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.doesNotMatch(health, /function Choice\(/);
  assert.match(account, /<TextInput[\s\S]*?value=\{email\}/);
  assert.match(account, /<TextInput[\s\S]*?value=\{password\}/);
});

test('journal uses selectable tags with one custom tag input while keeping entry bodies open', () => {
  const journal = readAppSource('(tabs)/journal.tsx');
  const ritualJournal = readComponentSource('../ritual/JournalStep.tsx');

  assert.match(journal, /import\s+\{[^}]*MultiChoiceField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(journal, /<MultiChoiceField[\s\S]*?label="Tags"[\s\S]*?allowCustom/);
  assert.doesNotMatch(journal, /tagDraft\s*\.\s*split\(\s*['"]\s*,\s*['"]\s*\)/);
  assert.match(journal, /<TextInput[\s\S]*?value=\{draft\}[\s\S]*?multiline/);
  assert.match(ritualJournal, /import\s+\{[^}]*MultiChoiceField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(ritualJournal, /<MultiChoiceField[\s\S]*?label="Tags"[\s\S]*?allowCustom/);
  assert.match(ritualJournal, /<TextInput[\s\S]*?value=\{journalText\}[\s\S]*?multiline/);
});

test('money uses local history suggestions and non-stepping currency fields', () => {
  const money = readAppSource('(tabs)/money.tsx');
  const moneyNumberFields = [...money.matchAll(/<NumberField[\s\S]*?\/>/g)].map(([field]) => field);

  assert.match(money, /import\s+\{\s*AutocompleteField\s*,\s*NumberField\s*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(money, /suggestFromHistory\(\s*''\s*,\s*expenses\.map\(\(expense\)\s*=>\s*expense\.merchant\)/);
  assert.match(money, /<AutocompleteField[\s\S]*?label="Merchant"[\s\S]*?suggestions=\{merchantSuggestions\}/);
  assert.match(money, /<AutocompleteField[\s\S]*?label="Goal name"[\s\S]*?suggestions=\{savingGoalSuggestions\}/);
  assert.ok(moneyNumberFields.length >= 6, 'all money amounts should use NumberField');
  for (const field of moneyNumberFields) {
    assert.match(field, /unit="R"/);
    assert.match(field, /showStepper=\{false\}/);
  }
});

test('meals use assisted profile and serving controls while leaving meal details open', () => {
  const profile = readAppSource('meals/profile.tsx');
  const manual = readAppSource('meals/manual.tsx');
  const submitFood = readAppSource('meals/submit-food.tsx');

  assert.match(profile, /import\s+\{[^}]*DateField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(profile, /import\s+\{[^}]*ChoiceGroup[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(profile, /import\s+\{[^}]*MultiChoiceField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(profile, /import\s+\{[^}]*AutocompleteField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
  assert.match(profile, /<DateField[\s\S]*?label="Date of birth"/);
  assert.match(profile, /<MultiChoiceField[\s\S]*?label="Dietary preferences"[\s\S]*?suggestions=\{dietChoices\}[\s\S]*?allowCustom/);
  assert.match(profile, /<MultiChoiceField[\s\S]*?label="Allergies"[\s\S]*?suggestions=\{allergyChoices\}[\s\S]*?allowCustom/);
  assert.match(profile, /<AutocompleteField[\s\S]*?label="Ingredients to avoid"[\s\S]*?suggestions=\{ingredientSuggestions\}/);
  assert.match(profile, /<ChoiceGroup[\s\S]*?label="Maximum prep time \(minutes\)"[\s\S]*?options=\{prepTimeOptions\}/);
  for (const choice of ['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'halal', 'fish', 'shellfish', 'peanut', 'tree nuts', 'dairy', 'egg', 'soy', 'wheat/gluten', 'sesame']) {
    assert.match(profile, new RegExp(`['\"]${choice}['\"]`));
  }
  for (const choice of [15, 30, 45, 60, 90]) assert.match(profile, new RegExp(`\\b${choice}\\b`));

  for (const source of [manual, submitFood]) {
    assert.match(source, /import\s+\{[^}]*NumberField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
    assert.match(source, /import\s+\{[^}]*SelectField[^}]*\}\s+from\s+['"]@\/components\/ui['"]/);
    assert.match(source, /<NumberField[\s\S]*?label="Quantity"[\s\S]*?step=\{0\.25\}/);
    assert.match(source, /<SelectField[\s\S]*?label="Unit"[\s\S]*?options=\{servingUnits\}[\s\S]*?allowCustom/);
  }

  assert.match(manual, /<Field label="Food or meal name"/);
  assert.match(manual, /<Field label="Notes"[\s\S]*?multiline/);
  assert.match(submitFood, /<Field label="Food name"/);
});
