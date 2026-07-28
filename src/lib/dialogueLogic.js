// ---------------------------------------------------------------------------
// Shared variant-resolution logic.
//
// Used by SequenceEditor (editing) and Simulator (playtesting) so both
// interpret a dialogue line's variants identically. If you add a runtime
// export/interpreter later (e.g. for Godot), this is the logic it needs to
// mirror too.
//
// VARIANT SHAPE (current):
//   {
//     id,
//     logicalOperator: "AND" | "OR",
//     conditions: [{ id, check_flag, operator, value }],
//     overrides: { [fieldId]: value },  // any dialogue-line field; blank/
//                                       // undefined entries fall back to
//                                       // the base line's value
//   }
//
// OLDER SHAPES this normalizes on read (never written going forward):
//   - Flat single-condition: { check_flag, operator, value, text }
// ---------------------------------------------------------------------------

export function normalizeVariant(variant) {
  const conditions = Array.isArray(variant.conditions)
    ? variant.conditions
    : variant.check_flag
      ? [
          {
            id: crypto.randomUUID(),
            check_flag: variant.check_flag,
            operator: variant.operator || "==",
            value: variant.value,
          },
        ]
      : [];

  const overrides = { ...(variant.overrides || {}) };
  // Migrate the old flat `text` field into overrides.text, but don't clobber
  // an already-set overrides.text (new-shape data wins if both exist).
  if (variant.text !== undefined && overrides.text === undefined) {
    overrides.text = variant.text;
  }

  return {
    id: variant.id,
    logicalOperator: variant.logicalOperator || "AND",
    conditions,
    overrides,
  };
}

// evaluateCondition: (operator, checkValue, targetValue) => boolean
// getValue: (variableName) => currentValue
export function evaluateConditionGroup(
  logicalOperator,
  conditions,
  evaluateCondition,
  getValue,
) {
  if (!conditions || conditions.length === 0) return false;
  const results = conditions.map((c) =>
    evaluateCondition(c.operator, getValue(c.check_flag), c.value),
  );
  return logicalOperator === "OR"
    ? results.some(Boolean)
    : results.every(Boolean);
}

// Finds the first variant whose condition group matches, and returns the
// base line with that variant's non-empty overrides merged on top. If no
// variant matches, returns the base line untouched.
export function resolveDialogueLine(line, evaluateCondition, getValue) {
  if (!Array.isArray(line.variants) || line.variants.length === 0) {
    return { line, matchedVariant: null };
  }

  for (const raw of line.variants) {
    const variant = normalizeVariant(raw);
    const matches = evaluateConditionGroup(
      variant.logicalOperator,
      variant.conditions,
      evaluateCondition,
      getValue,
    );
    if (matches) {
      const resolved = { ...line };
      Object.entries(variant.overrides).forEach(([key, val]) => {
        if (val !== undefined && val !== "") resolved[key] = val;
      });
      return { line: resolved, matchedVariant: variant };
    }
  }

  return { line, matchedVariant: null };
}
