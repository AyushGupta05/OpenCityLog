#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const BASE_SCRIPT = path.join(__dirname, "fetch_round672_london_pld_lifecycle_next133_candidates.js");

function replaceRequired(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round676 wrapper marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs
  .readFileSync(BASE_SCRIPT, "utf8")
  .replace(/^\uFEFF/, "")
  .replace(/^#!.*\r?\n/, "")
  .replace(/\r\n/g, "\n");

source = replaceRequired(source, "const ROUND = 672;", "const ROUND = 676;");
source = replaceRequired(source, 'const NEXT = "next133";', 'const NEXT = "next135";');

if (!source.includes("const ROUND = 676;") || !source.includes('const NEXT = "next135";')) {
  throw new Error("Round676 wrapper did not advance round/next constants");
}

vm.runInNewContext(
  source,
  {
    require,
    console,
    process,
    fetch,
    Buffer,
    setTimeout,
    clearTimeout,
    __dirname,
    module: { exports: {} },
    exports: {},
  },
  {
    filename: "generated_round676_london_pld_lifecycle_next135.js",
  },
);
