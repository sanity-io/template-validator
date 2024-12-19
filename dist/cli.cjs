#!/usr/bin/env node
"use strict";
var index = require("./index.cjs");
const directory = process.argv[2] || process.cwd();
index.validateLocal(directory);
//# sourceMappingURL=cli.cjs.map
