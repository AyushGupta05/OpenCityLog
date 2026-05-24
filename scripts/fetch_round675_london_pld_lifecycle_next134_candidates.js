#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const BASE_SCRIPT = path.join(__dirname, "fetch_round672_london_pld_lifecycle_next133_candidates.js");

function replaceRequired(source, search, replacement) {
  if (!source.includes(search)) {
    throw new Error(`Round675 wrapper marker not found: ${search}`);
  }
  return source.split(search).join(replacement);
}

let source = fs
  .readFileSync(BASE_SCRIPT, "utf8")
  .replace(/^\uFEFF/, "")
  .replace(/^#!.*\r?\n/, "")
  .replace(/\r\n/g, "\n");

source = replaceRequired(source, "const ROUND = 672;", "const ROUND = 675;");
source = replaceRequired(source, 'const NEXT = "next133";', 'const NEXT = "next134";');

if (!source.includes("const ROUND = 675;") || !source.includes('const NEXT = "next134";')) {
  throw new Error("Round675 wrapper did not advance round/next constants");
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
    filename: "generated_round675_london_pld_lifecycle_next134.js",
  },
);
