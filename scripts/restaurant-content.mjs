import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

// Test and smoke-check input; Astro remains responsible for content validation.
export function readRestaurants() {
  const directory = new URL('../src/content/restaurants/', import.meta.url);
  return readdirSync(directory).filter(file => file.endsWith('.md')).map(file => {
    const source = readFileSync(new URL(file, directory), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!match) throw new Error(`Missing frontmatter: ${file}`);
    return { ...parse(match[1]), id: file.slice(0, -3), body: match[2] };
  });
}
