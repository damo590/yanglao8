import test from "node:test";
import assert from "node:assert/strict";

import {
  questions,
  categoryMeta
} from "../src/data/fallRiskQuestions.ts";

test("fall risk question bank uses the collection-first schema", () => {
  assert.ok(Array.isArray(questions));
  assert.equal(questions.length, 40);
  assert.ok(
    questions.some((question) =>
      question.options.some((option) => option.infoGap === true)
    )
  );

  const validModes = new Set(["weekly", "standard", "full", "custom"]);
  const validCategories = new Set(Object.keys(categoryMeta));

  for (const question of questions) {
    assert.equal(typeof question.id, "string");
    assert.equal(typeof question.module, "string");
    assert.ok(validCategories.has(question.category));
    assert.equal(typeof question.text, "string");
    assert.ok(Array.isArray(question.modes));
    assert.ok(question.modes.length >= 1);
    assert.ok(question.modes.every((mode) => validModes.has(mode)));
    assert.ok(Array.isArray(question.options));
    assert.ok(question.options.length >= 4);
    assert.ok(!("correctAnswer" in question));

    for (const option of question.options) {
      assert.equal(typeof option.label, "string");
      assert.equal(typeof option.score, "number");
      if ("infoGap" in option) assert.equal(typeof option.infoGap, "boolean");
      if ("redFlag" in option) assert.equal(typeof option.redFlag, "boolean");
      if ("tags" in option) assert.ok(Array.isArray(option.tags));
      if ("actions" in option) assert.ok(Array.isArray(option.actions));
    }
  }
});
