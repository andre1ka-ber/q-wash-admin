import { describe, expect, it } from 'vitest';
import { pluralRu } from './pluralRu';

const FORMS: [string, string, string] = ['заявка', 'заявки', 'заявок'];

describe('pluralRu', () => {
  it.each([
    [0, 'заявок'],
    [1, 'заявка'],
    [2, 'заявки'],
    [3, 'заявки'],
    [4, 'заявки'],
    [5, 'заявок'],
    [9, 'заявок'],
    [10, 'заявок'],
    [11, 'заявок'],
    [12, 'заявок'],
    [14, 'заявок'],
    [21, 'заявка'],
    [22, 'заявки'],
    [25, 'заявок'],
    [100, 'заявок'],
    [101, 'заявка'],
    [111, 'заявок'],
    [122, 'заявки'],
  ])('pluralRu(%i, ...) === %s', (n, expected) => {
    expect(pluralRu(n, FORMS)).toBe(expected);
  });
});
