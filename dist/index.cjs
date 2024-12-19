"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 });
var path = require("node:path"), fs = require("node:fs/promises"), yaml = require("yaml");
function _interopDefaultCompat(e) {
  return e && typeof e == "object" && "default" in e ? e : { default: e };
}
var path__default = /* @__PURE__ */ _interopDefaultCompat(path), fs__default = /* @__PURE__ */ _interopDefaultCompat(fs);
class GitHubFileReader {
  constructor(baseUrl, headers = {}) {
    this.baseUrl = baseUrl, this.headers = headers;
  }
  async readFile(filePath) {
    const response = await fetch(`${this.baseUrl}/${filePath}`, { headers: this.headers });
    return {
      exists: response.status === 200,
      content: await response.text()
    };
  }
}
class LocalFileReader {
  constructor(basePath) {
    this.basePath = basePath;
  }
  async readFile(filePath) {
    try {
      const fullPath = path__default.default.join(this.basePath, filePath);
      return {
        exists: !0,
        content: await fs__default.default.readFile(fullPath, "utf-8")
      };
    } catch {
      return {
        exists: !1,
        content: ""
      };
    }
  }
}
const REQUIRED_ENV_VAR = {
  PROJECT_ID: /SANITY(?:_STUDIO)?_PROJECT_ID/,
  DATASET: /SANITY(?:_STUDIO)?_DATASET/
}, ENV_FILE = {
  TEMPLATE: ".env.template",
  EXAMPLE: ".env.example",
  LOCAL_EXAMPLE: ".env.local.example",
  LOCAL_TEMPLATE: ".env.local.template"
}, ENV_TEMPLATE_FILES = [
  ENV_FILE.TEMPLATE,
  ENV_FILE.EXAMPLE,
  ENV_FILE.LOCAL_EXAMPLE,
  ENV_FILE.LOCAL_TEMPLATE
];
async function getMonoRepo(fileReader) {
  const handlers = {
    "package.json": {
      check: (content) => {
        try {
          const pkg = JSON.parse(content);
          return pkg.workspaces ? Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages : void 0;
        } catch {
          return;
        }
      }
    },
    "pnpm-workspace.yaml": {
      check: (content) => {
        try {
          return yaml.parse(content).packages;
        } catch {
          return;
        }
      }
    },
    "lerna.json": {
      check: (content) => {
        try {
          return JSON.parse(content).packages;
        } catch {
          return;
        }
      }
    },
    "rush.json": {
      check: (content) => {
        try {
          return JSON.parse(content).projects?.map((p) => p.packageName);
        } catch {
          return;
        }
      }
    }
  }, fileChecks = await Promise.all(
    Object.keys(handlers).map(async (file) => {
      const result = await fileReader.readFile(file);
      return { file, ...result };
    })
  );
  for (const check of fileChecks) {
    if (!check.exists) continue;
    const result = handlers[check.file].check(check.content);
    if (result) return result;
  }
}
async function validatePackage(fileReader, packagePath) {
  const errors = [], requiredFiles = [
    "package.json",
    "sanity.config.ts",
    "sanity.config.js",
    "sanity.cli.ts",
    "sanity.cli.js",
    ...ENV_TEMPLATE_FILES
  ], fileChecks = await Promise.all(
    requiredFiles.map(async (file) => {
      const filePath = packagePath ? path.join(packagePath, file) : file, result = await fileReader.readFile(filePath);
      return { file, ...result };
    })
  ), packageJson = fileChecks.find((f) => f.file === "package.json");
  packageJson?.exists || errors.push(`Package at ${packagePath || "root"} must include a package.json file`);
  let hasSanityDep = !1;
  if (packageJson?.exists)
    try {
      const pkg = JSON.parse(packageJson.content);
      hasSanityDep = !!(pkg.dependencies?.sanity || pkg.devDependencies?.sanity);
    } catch {
      errors.push(`Invalid package.json file in ${packagePath || "root"}`);
    }
  const hasSanityConfig = fileChecks.some(
    (f) => f.exists && (f.file === "sanity.config.ts" || f.file === "sanity.config.js")
  ), hasSanityCli = fileChecks.some(
    (f) => f.exists && (f.file === "sanity.cli.ts" || f.file === "sanity.cli.js")
  ), envFile = fileChecks.find(
    (f) => f.exists && ENV_TEMPLATE_FILES.includes(f.file)
  );
  if (envFile) {
    const envContent = envFile.content, hasProjectId = envContent.match(REQUIRED_ENV_VAR.PROJECT_ID), hasDataset = envContent.match(REQUIRED_ENV_VAR.DATASET);
    if (!hasProjectId || !hasDataset) {
      const missing = [];
      hasProjectId || missing.push("SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID"), hasDataset || missing.push("SANITY_DATASET or SANITY_STUDIO_DATASET"), errors.push(
        `Environment template in ${packagePath || "repo"} must include the following variables: ${missing.join(", ")}`
      );
    }
  }
  return {
    hasSanityConfig,
    hasSanityCli,
    hasEnvFile: !!envFile,
    hasSanityDep,
    errors
  };
}
async function validateSanityTemplate(fileReader, packages = [""]) {
  const errors = [], validations = await Promise.all(packages.map((pkg) => validatePackage(fileReader, pkg)));
  for (const v of validations)
    errors.push(...v.errors);
  validations.some((v) => v.hasSanityDep) || errors.push('At least one package must include "sanity" as a dependency in package.json'), validations.some((v) => v.hasSanityConfig) || errors.push("At least one package must include a sanity.config.js or sanity.config.ts file"), validations.some((v) => v.hasSanityCli) || errors.push("At least one package must include a sanity.cli.js or sanity.cli.ts file");
  const missingEnvPackages = packages.filter((_, i) => !validations[i].hasEnvFile);
  return missingEnvPackages.length > 0 && errors.push(
    `The following packages are missing .env.template, .env.example, or .env.local.example files: ${missingEnvPackages.map((p) => p || "root").join(", ")}`
  ), {
    isValid: errors.length === 0,
    errors
  };
}
async function validateLocal(directory) {
  const fileReader = new LocalFileReader(directory);
  try {
    const packages = await getMonoRepo(fileReader) || [""], result = await validateSanityTemplate(fileReader, packages);
    if (result.isValid)
      console.log("Validation successful!");
    else {
      console.error("Validation failed:");
      for (const error of result.errors)
        console.error(`- ${error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Validation failed:", error), process.exit(1);
  }
}
if (require.main === module) {
  const directory = process.argv[2] || process.cwd();
  validateLocal(path__default.default.resolve(directory));
}
exports.ENV_FILE = ENV_FILE;
exports.ENV_TEMPLATE_FILES = ENV_TEMPLATE_FILES;
exports.GitHubFileReader = GitHubFileReader;
exports.LocalFileReader = LocalFileReader;
exports.REQUIRED_ENV_VAR = REQUIRED_ENV_VAR;
exports.getMonoRepo = getMonoRepo;
exports.validateLocal = validateLocal;
exports.validateSanityTemplate = validateSanityTemplate;
//# sourceMappingURL=index.cjs.map
