const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    configDir: "config/cities",
    sourceRegistry: "config/source_registry.json",
    schemaDir: "schemas",
    atlasDir: "web/data/city-atlas",
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--config-dir") {
      args.configDir = next;
      index += 1;
    } else if (arg === "--source-registry") {
      args.sourceRegistry = next;
      index += 1;
    } else if (arg === "--schema-dir") {
      args.schemaDir = next;
      index += 1;
    } else if (arg === "--atlas-dir") {
      args.atlasDir = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function toPosix(value) {
  return String(value).split(path.sep).join("/");
}

function relativeFromRoot(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(failures, message) {
  failures.push(message);
}

function typeMatches(value, expectedType) {
  if (expectedType === "null") return value === null;
  if (expectedType === "array") return Array.isArray(value);
  if (expectedType === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (expectedType === "integer") return Number.isInteger(value);
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === expectedType;
}

function schemaTypeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function resolveRef(ref, rootSchema) {
  if (!ref.startsWith("#/")) throw new Error(`Only local schema refs are supported: ${ref}`);
  return ref
    .slice(2)
    .split("/")
    .reduce((current, token) => {
      const key = token.replace(/~1/g, "/").replace(/~0/g, "~");
      return current?.[key];
    }, rootSchema);
}

function validateValue(value, schema, label, failures, rootSchema = schema) {
  if (!schema || typeof schema !== "object") return;
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, rootSchema);
    if (!resolved) {
      fail(failures, `${label} references missing schema ${schema.$ref}`);
      return;
    }
    validateValue(value, resolved, label, failures, rootSchema);
    return;
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) {
      fail(failures, `${label} expected ${types.join("|")}, got ${schemaTypeName(value)}`);
      return;
    }
  }

  if (value === null || value === undefined) return;

  if (Object.prototype.hasOwnProperty.call(schema, "const") && stableStringify(value) !== stableStringify(schema.const)) {
    fail(failures, `${label} must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    fail(failures, `${label} has invalid enum value ${JSON.stringify(value)}`);
  }
  if (schema.pattern && typeof value === "string" && !(new RegExp(schema.pattern).test(value))) {
    fail(failures, `${label} does not match pattern ${schema.pattern}`);
  }
  if (Number.isFinite(schema.minimum) && typeof value === "number" && value < schema.minimum) {
    fail(failures, `${label} is below minimum ${schema.minimum}`);
  }
  if (Number.isFinite(schema.maximum) && typeof value === "number" && value > schema.maximum) {
    fail(failures, `${label} is above maximum ${schema.maximum}`);
  }
  if (Number.isInteger(schema.minLength) && typeof value === "string" && value.length < schema.minLength) {
    fail(failures, `${label} is shorter than minLength ${schema.minLength}`);
  }
  if (Number.isInteger(schema.maxLength) && typeof value === "string" && value.length > schema.maxLength) {
    fail(failures, `${label} is longer than maxLength ${schema.maxLength}`);
  }

  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      fail(failures, `${label} has fewer than ${schema.minItems} item(s)`);
    }
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
      fail(failures, `${label} has more than ${schema.maxItems} item(s)`);
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      for (const item of value) {
        const key = stableStringify(item);
        if (seen.has(key)) {
          fail(failures, `${label} has duplicate item ${key}`);
          break;
        }
        seen.add(key);
      }
    }
    if (Array.isArray(schema.prefixItems)) {
      schema.prefixItems.forEach((itemSchema, index) => {
        if (index < value.length) validateValue(value[index], itemSchema, `${label}[${index}]`, failures, rootSchema);
      });
    }
    if (schema.items) {
      value.forEach((item, index) => validateValue(item, schema.items, `${label}[${index}]`, failures, rootSchema));
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const requiredKey of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
        fail(failures, `${label}.${requiredKey} is required`);
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        validateValue(value[key], propertySchema, `${label}.${key}`, failures, rootSchema);
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) fail(failures, `${label}.${key} is not allowed`);
      }
    }
  }
}

function validateObjectAgainstSchema(failures, object, schema, label) {
  validateValue(object, schema, label, failures, schema);
}

function loadSchemas(root, schemaDir) {
  let dir = resolve(root, schemaDir);
  if (!fs.existsSync(dir)) {
    dir = path.join(__dirname, "..", schemaDir);
  }
  return {
    city: readJson(path.join(dir, "city.schema.json")),
    source: readJson(path.join(dir, "source.schema.json")),
    event: readJson(path.join(dir, "event.schema.json")),
    availability: readJson(path.join(dir, "availability.schema.json")),
    architectureSourceInventory: readJson(path.join(dir, "architecture_source_inventory.schema.json")),
    correctionLedger: fs.existsSync(path.join(dir, "correction_record.schema.json"))
      ? readJson(path.join(dir, "correction_record.schema.json"))
      : null,
  };
}

function validateConfigCities(root, configDir, schemas, failures) {
  const dir = resolve(root, configDir);
  if (!fs.existsSync(dir)) {
    fail(failures, `Missing city config directory ${relativeFromRoot(root, dir)}`);
    return;
  }
  for (const name of fs.readdirSync(dir).filter((item) => item.endsWith(".json")).sort()) {
    validateObjectAgainstSchema(failures, readJson(path.join(dir, name)), schemas.city, `config/cities/${name}`);
  }
}

function validateSourceRegistry(root, sourceRegistryPath, schemas, failures) {
  const registryPath = resolve(root, sourceRegistryPath);
  const registry = readJson(registryPath);
  if (!Array.isArray(registry.sources)) {
    fail(failures, `${relativeFromRoot(root, registryPath)}.sources must be an array`);
    return;
  }
  registry.sources.forEach((source, index) => {
    validateObjectAgainstSchema(failures, source, schemas.source, `${relativeFromRoot(root, registryPath)}.sources[${index}]`);
  });
}

function validateOptionalArtifacts(root, schemas, failures) {
  const architecturePath = path.join(root, "config", "architecture_source_inventory.json");
  if (fs.existsSync(architecturePath)) {
    validateObjectAgainstSchema(failures, readJson(architecturePath), schemas.architectureSourceInventory, relativeFromRoot(root, architecturePath));
  }
  const correctionPath = path.join(root, "data", "corrections", "corrections.json");
  if (schemas.correctionLedger && fs.existsSync(correctionPath)) {
    const correctionLedger = readJson(correctionPath);
    const correctionLabel = relativeFromRoot(root, correctionPath);
    validateObjectAgainstSchema(failures, correctionLedger, schemas.correctionLedger, correctionLabel);
    validateCorrectionLedgerIds(correctionLedger, correctionLabel, failures);
  }
}

function validateCorrectionLedgerIds(correctionLedger, label, failures) {
  const seen = new Set();
  for (const [index, correction] of (correctionLedger.corrections || []).entries()) {
    const correctionId = correction?.correction_id;
    if (!correctionId) continue;
    if (seen.has(correctionId)) {
      fail(failures, `${label}.corrections[${index}].correction_id duplicates ${correctionId}`);
      continue;
    }
    seen.add(correctionId);
  }
}

function validateAtlasArtifacts(root, atlasDir, schemas, failures) {
  const atlasRoot = resolve(root, atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  if (!fs.existsSync(indexPath)) {
    fail(failures, `Missing atlas index ${relativeFromRoot(root, indexPath)}`);
    return;
  }
  const index = readJson(indexPath);
  for (const citySummary of index.cities || []) {
    const cityDir = path.join(atlasRoot, "cities", citySummary.city_id);
    const cityPath = path.join(cityDir, "city.json");
    const sourcesPath = path.join(cityDir, "sources.json");
    const availabilityPath = path.join(cityDir, "availability.json");
    const eventsPath = path.join(cityDir, "events.json");

    if (fs.existsSync(cityPath)) {
      validateObjectAgainstSchema(failures, readJson(cityPath), schemas.city, relativeFromRoot(root, cityPath));
    } else {
      fail(failures, `Missing ${relativeFromRoot(root, cityPath)}`);
    }

    if (fs.existsSync(sourcesPath)) {
      const sourcesPayload = readJson(sourcesPath);
      if (!Array.isArray(sourcesPayload.sources)) {
        fail(failures, `${relativeFromRoot(root, sourcesPath)}.sources must be an array`);
      } else {
        sourcesPayload.sources.forEach((source, index) => {
          validateObjectAgainstSchema(failures, source, schemas.source, `${relativeFromRoot(root, sourcesPath)}.sources[${index}]`);
        });
      }
    } else {
      fail(failures, `Missing ${relativeFromRoot(root, sourcesPath)}`);
    }

    if (fs.existsSync(availabilityPath)) {
      validateObjectAgainstSchema(failures, readJson(availabilityPath), schemas.availability, relativeFromRoot(root, availabilityPath));
    } else {
      fail(failures, `Missing ${relativeFromRoot(root, availabilityPath)}`);
    }

    if (fs.existsSync(eventsPath)) {
      const eventsIndex = readJson(eventsPath);
      for (const chunk of eventsIndex.chunks || []) {
        const chunkPath = resolve(root, chunk.json_path);
        if (!fs.existsSync(chunkPath)) {
          fail(failures, `Missing event chunk ${chunk.json_path}`);
          continue;
        }
        const payload = readJson(chunkPath);
        (payload.events || []).forEach((event, index) => {
          validateObjectAgainstSchema(failures, event, schemas.event, `${relativeFromRoot(root, chunkPath)}.events[${index}]`);
        });
      }
    } else {
      fail(failures, `Missing ${relativeFromRoot(root, eventsPath)}`);
    }
  }
}

function validate(args) {
  const failures = [];
  const schemas = loadSchemas(args.root, args.schemaDir);
  validateConfigCities(args.root, args.configDir, schemas, failures);
  validateSourceRegistry(args.root, args.sourceRegistry, schemas, failures);
  validateOptionalArtifacts(args.root, schemas, failures);
  validateAtlasArtifacts(args.root, args.atlasDir, schemas, failures);
  return failures;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const failures = validate(args);
    if (failures.length) {
      console.error("Schema validation failed:");
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
    console.log("Schema validation OK: city configs, source entries, availability matrices, and event chunks match local JSON schemas.");
  } catch (error) {
    console.error(`verify:schema failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  validate,
  validateValue,
};
