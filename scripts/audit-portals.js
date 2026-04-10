#!/usr/bin/env node
/**
 * DXP Portal Compliance Auditor
 *
 * Enforces that portal code uses @dxp/ui components and @dxp/sdk-react hooks
 * instead of hand-rolling UI or calling the BFF directly.
 *
 * Usage:
 *   node scripts/audit-portals.js              # audit all portals
 *   node scripts/audit-portals.js --fix-report # write violations.json
 *   node scripts/audit-portals.js wealth-portal # audit one portal
 *
 * Exit codes: 0 = clean, 1 = errors found, 2 = warnings only
 */

const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

const PORTAL_DIRS = [
  'starters/wealth-portal/src',
  'starters/payer-portal/src',
  'starters/insurance-portal/src',
];

// Raw HTML elements that have @dxp/ui equivalents — ERROR level
const FORBIDDEN_ELEMENTS = [
  {
    pattern: /<table[\s>]/,
    component: 'DataTable',
    message: 'Use <DataTable> from @dxp/ui instead of <table>',
  },
  {
    // Allow type=checkbox|radio|file|hidden|range|color|date|time|datetime-local — no @dxp/ui equivalent
    pattern: /<input(?!\s[^>]*type=["'](checkbox|radio|file|hidden|range|color|date|time|datetime-local))/,
    component: 'Input',
    message: 'Use <Input> from @dxp/ui instead of <input>',
  },
  {
    pattern: /<select[\s>]/,
    component: 'Select',
    message: 'Use <Select> from @dxp/ui instead of <select>',
  },
  {
    pattern: /<tr[\s>]/,
    component: 'DataTable',
    message: 'Use <DataTable> from @dxp/ui instead of raw table rows',
  },
  {
    pattern: /<td[\s>]/,
    component: 'DataTable',
    message: 'Use <DataTable> from @dxp/ui instead of raw table cells',
  },
  {
    pattern: /<th[\s>]/,
    component: 'DataTable',
    message: 'Use <DataTable> from @dxp/ui instead of raw table headers',
  },
];

// Third-party UI libraries that must NOT be imported in portal code — ERROR
const FORBIDDEN_IMPORTS = [
  { pattern: /from ['"]antd['"]/, library: 'antd' },
  { pattern: /from ['"]@mui\//, library: '@mui/*' },
  { pattern: /from ['"]@chakra-ui\//, library: '@chakra-ui/*' },
  { pattern: /from ['"]react-bootstrap['"]/, library: 'react-bootstrap' },
  { pattern: /from ['"]@headlessui\//, library: '@headlessui/*' },
  { pattern: /from ['"]primereact\//, library: 'primereact' },
  { pattern: /from ['"]@mantine\//, library: '@mantine/*' },
  { pattern: /from ['"]react-icons\//, library: 'react-icons' },
];

// Direct BFF calls bypassing SDK hooks — WARNING level
const FORBIDDEN_BFF_PATTERNS = [
  {
    pattern: /fetch\(['"`]\/api\//,
    message: 'Use @dxp/sdk-react hooks instead of direct fetch() to BFF',
  },
  {
    pattern: /axios\.(get|post|put|delete|patch)\(['"`]\/api\//,
    message: 'Use @dxp/sdk-react hooks instead of direct axios calls to BFF',
  },
  {
    pattern: /fetch\(['"`]http:\/\/localhost:\d+\/api\//,
    message: 'Use @dxp/sdk-react hooks instead of direct BFF URL calls',
  },
];

// Raw <button> with styling is a WARNING (may be intentional for toggle UI)
const BUTTON_PATTERN = /<button\s[^>]*className=/;

// Files/dirs to skip entirely
const SKIP_FILES = new Set(['main.tsx', 'App.tsx', 'index.tsx', 'vite-env.d.ts', 'router.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.vite', '__tests__', 'test']);

// Allowed to use raw elements (the component library implementations themselves)
const ALLOWED_PATHS = ['packages/ui/src'];

// ── File walker ──────────────────────────────────────────────────────────────

function walkTsx(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTsx(full, files);
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      if (!SKIP_FILES.has(entry.name)) files.push(full);
    }
  }
  return files;
}

// ── Violation collector ──────────────────────────────────────────────────────

function auditFile(filePath) {
  const rel = path.relative(ROOT, filePath);

  // Skip allowed paths (the UI package itself)
  if (ALLOWED_PATHS.some((p) => rel.startsWith(p))) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  const addViolation = (lineNum, severity, rule, message) => {
    violations.push({ file: rel, line: lineNum + 1, severity, rule, message });
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Skip comment lines and JSX inside the ui package
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // Forbidden imports (ERROR)
    for (const imp of FORBIDDEN_IMPORTS) {
      if (imp.pattern.test(line)) {
        addViolation(i, 'error', 'no-third-party-ui',
          `Forbidden UI library import: ${imp.library} — use @dxp/ui instead`);
      }
    }

    // Forbidden HTML elements (ERROR)
    for (const elem of FORBIDDEN_ELEMENTS) {
      if (elem.pattern.test(line)) {
        // For <input> pattern: multiline JSX may place type= on the next few lines.
        // Join the current line with up to 3 following lines and re-test with the
        // full exemption regex before flagging.
        if (elem.component === 'Input') {
          const lookahead = lines.slice(i, i + 4).join(' ');
          const exemptTypes = /type=["'](checkbox|radio|file|hidden|range|color|date|time|datetime-local)/;
          if (exemptTypes.test(lookahead)) continue;
        }
        addViolation(i, 'error', 'use-dxp-component', elem.message);
      }
    }

    // Direct BFF calls (WARNING)
    for (const bff of FORBIDDEN_BFF_PATTERNS) {
      if (bff.pattern.test(line)) {
        addViolation(i, 'warning', 'use-sdk-hooks', bff.message);
      }
    }

    // Raw styled buttons (WARNING — may be intentional toggle UI)
    if (BUTTON_PATTERN.test(line) && !line.includes('disabled') && !line.includes('aria-')) {
      addViolation(i, 'warning', 'use-button-component',
        'Consider using <Button> from @dxp/ui instead of a raw styled <button>');
    }
  });

  return violations;
}

// ── Renderer ─────────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const RED   = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

function renderViolations(allViolations) {
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  let errorCount = 0;
  let warnCount = 0;

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`\n${BOLD}${file}${RESET}`);
    for (const v of violations) {
      const color = v.severity === 'error' ? RED : YELLOW;
      const icon  = v.severity === 'error' ? '✖' : '⚠';
      console.log(`  ${color}${icon}${RESET} ${DIM}line ${v.line}${RESET}  ${v.message}`);
      if (v.severity === 'error') errorCount++;
      else warnCount++;
    }
  }

  return { errorCount, warnCount };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const fixReport = args.includes('--fix-report');
  const portalFilter = args.find((a) => !a.startsWith('--'));

  const dirsToAudit = PORTAL_DIRS.filter((d) =>
    !portalFilter || d.includes(portalFilter)
  );

  if (dirsToAudit.length === 0) {
    console.error(`No portal found matching: ${portalFilter}`);
    console.error(`Available: ${PORTAL_DIRS.map((d) => d.split('/')[1]).join(', ')}`);
    process.exit(1);
  }

  console.log(`${BOLD}DXP Portal Compliance Audit${RESET}`);
  console.log(`${DIM}Scanning: ${dirsToAudit.map((d) => d.split('/')[1]).join(', ')}${RESET}`);
  console.log(`${DIM}Rules: no-third-party-ui | use-dxp-component | use-sdk-hooks | use-button-component${RESET}`);

  const allFiles = dirsToAudit.flatMap((d) => walkTsx(path.join(ROOT, d)));
  const allViolations = allFiles.flatMap(auditFile);

  if (allViolations.length === 0) {
    console.log(`\n${GREEN}${BOLD}✔ All portals are compliant — no violations found.${RESET}`);
    console.log(`${DIM}  Scanned ${allFiles.length} files${RESET}`);
    process.exit(0);
  }

  const { errorCount, warnCount } = renderViolations(allViolations);

  console.log(`\n${BOLD}Summary${RESET}`);
  console.log(`  Files scanned : ${allFiles.length}`);
  console.log(`  ${RED}Errors        : ${errorCount}${RESET}  (must fix — use @dxp/ui component)`);
  console.log(`  ${YELLOW}Warnings      : ${warnCount}${RESET}  (review — may be intentional)`);

  if (fixReport) {
    const reportPath = path.join(ROOT, 'violations.json');
    fs.writeFileSync(reportPath, JSON.stringify(allViolations, null, 2));
    console.log(`\n  Report written to violations.json`);
  }

  if (errorCount > 0) {
    console.log(`\n${RED}${BOLD}✖ Audit failed — ${errorCount} error(s) must be fixed before merge.${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${YELLOW}${BOLD}⚠ Audit passed with warnings — please review.${RESET}`);
    process.exit(2);
  }
}

main();
