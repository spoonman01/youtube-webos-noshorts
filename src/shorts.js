/* eslint no-redeclare: 0 */

import { configRead } from './config';
import { isShortsNode } from './shorts-shared';

function stripShorts(node) {
  if (node == null || typeof node !== 'object') return;

  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      if (isShortsNode(node[i])) {
        node.splice(i, 1);
      } else {
        stripShorts(node[i]);
      }
    }
    return;
  }

  for (const key in node) {
    stripShorts(node[key]);
  }
}

const origParse = JSON.parse;
JSON.parse = function () {
  const r = origParse.apply(this, arguments);
  try {
    if (!configRead('blockShorts')) {
      return r;
    }

    stripShorts(r);
  } catch (e) {
    console.warn('Shorts filter failed:', e);
  }
  return r;
};
