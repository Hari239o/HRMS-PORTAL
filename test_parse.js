const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const Parser = acorn.Parser.extend(jsx());

const code = fs.readFileSync('client/src/app/(protected)/attendance/page.jsx', 'utf8');

try {
  Parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020,
    locations: true
  });
  console.log("Parsing successful!");
} catch (e) {
  console.error("Parse Error:");
  console.error(e.message);
  console.error("At line:", e.loc.line, "column:", e.loc.column);
  
  const lines = code.split('\n');
  for(let i = Math.max(0, e.loc.line - 3); i <= Math.min(lines.length - 1, e.loc.line + 2); i++) {
    console.error(`${i+1}: ${lines[i]}`);
  }
}
