import { optimize } from '../../lib/svgo.js';
import { decodeSVGDatauri } from '../../lib/svgo/tools.js';

/**
 * @param {string} fill
 * @param {import('../../lib/types.js').Config} config
 * @returns {string}
 */
const optimizeFill = (fill, config) => {
  const { data } = optimize(
    `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="${fill}"/></svg>`,
    config,
  );
  return data;
};

describe('convertColors in css datauri mode', () => {
  it('picks the shortest color form by encoded length', () => {
    /** @type {import('../../lib/types.js').Config} */
    const config = { datauri: 'css', plugins: ['convertColors'] };
    // "#" is percent-encoded as "%23", so color names shorter than the
    // encoded hex notation win
    expect(optimizeFill('#fff', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='white'/%3E%3C/svg%3E`,
    );
    expect(optimizeFill('white', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='white'/%3E%3C/svg%3E`,
    );
    expect(optimizeFill('#000', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='black'/%3E%3C/svg%3E`,
    );
    expect(optimizeFill('#00f', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='blue'/%3E%3C/svg%3E`,
    );
    // "%23f0f" is shorter than "fuchsia", so the hex notation is kept
    expect(optimizeFill('#f0f', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f0f'/%3E%3C/svg%3E`,
    );
    expect(optimizeFill('fuchsia', config)).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f0f'/%3E%3C/svg%3E`,
    );
  });

  it('applies when running through preset-default', () => {
    const { data } = optimize(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#ffffff"/></svg>',
      { datauri: 'css' },
    );
    expect(data).toBe(
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='white'/%3E%3C/svg%3E`,
    );
  });

  it('keeps the legacy behavior in other datauri formats', () => {
    /** @type {import('../../lib/types.js').DataUri[]} */
    const formats = ['base64', 'enc', 'unenc'];
    for (const datauri of formats) {
      /** @type {import('../../lib/types.js').Config} */
      const config = { datauri, plugins: ['convertColors'] };
      // "white" and "blue" are longer than "#fff" and "#00f" when "#"
      // is not percent-encoded
      expect(decodeSVGDatauri(optimizeFill('#fff', config))).toBe(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#fff"/></svg>',
      );
      expect(decodeSVGDatauri(optimizeFill('#00f', config))).toBe(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#00f"/></svg>',
      );
    }
  });
});
