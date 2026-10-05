import { decodeSVGDatauri, encodeSVGDatauri } from './tools.js';

test('encode as base64', () => {
  expect(encodeSVGDatauri('<svg/>', 'base64')).toBe(
    'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64'),
  );
  // base64 is still the default when no type is given
  expect(encodeSVGDatauri('<svg/>')).toBe(encodeSVGDatauri('<svg/>', 'base64'));
});

test('encode as enc', () => {
  expect(encodeSVGDatauri('<svg a="x"/>', 'enc')).toBe(
    'data:image/svg+xml,' + encodeURIComponent('<svg a="x"/>'),
  );
});

test('encode as unenc', () => {
  expect(encodeSVGDatauri('<svg/>', 'unenc')).toBe('data:image/svg+xml,<svg/>');
});

test('encode as css', () => {
  expect(encodeSVGDatauri("<svg xmlns='x'><g fill='#fff'/></svg>", 'css')).toBe(
    "data:image/svg+xml,%3Csvg xmlns='x'%3E%3Cg fill='%23fff'/%3E%3C/svg%3E",
  );

  // characters safe inside a double quoted CSS url() stay untouched
  expect(encodeSVGDatauri('a b=c:d/e&f', 'css')).toBe(
    'data:image/svg+xml,a b=c:d/e&f',
  );

  // no line breaks or other control characters survive
  expect(encodeSVGDatauri('a\nb\tc\rd', 'css')).toBe(
    'data:image/svg+xml,a%0Ab%09c%0Dd',
  );

  // double quotes and backslashes are encoded so the CSS string stays intact
  expect(encodeSVGDatauri('"\\', 'css')).toBe('data:image/svg+xml,%22%5C');
});

test('throws on unknown datauri type', () => {
  expect(() =>
    encodeSVGDatauri('<svg/>', /** @type {any} */ ('unknown')),
  ).toThrow(
    `Invalid datauri value "unknown", must be one of 'base64', 'enc', 'unenc' or 'css'`,
  );
});

test('css data uris can be decoded back into the original svg', () => {
  const svg = "<svg xmlns='x'><g fill='#fff'/></svg>";
  const encoded = encodeSVGDatauri(svg, 'css');
  expect(decodeSVGDatauri(encoded)).toBe(svg);
});
