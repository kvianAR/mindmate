import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePagination, isText, stringList } from '../lib/validation.mjs';
import { parseFlashcards } from '../lib/ai-output.mjs';

test('pagination rejects unbounded, negative and unexpected sort inputs', () => {
  for (const query of ['page=0', 'limit=100000', 'limit=-1', 'page=1.5', 'sortBy=password', 'sortOrder=random']) {
    assert.equal(parsePagination(new URLSearchParams(query), ['createdAt']), null);
  }
  assert.deepEqual(parsePagination(new URLSearchParams('page=2&limit=12'), ['createdAt']), { page: 2, limit: 12, sortBy: 'createdAt', sortOrder: 'desc' });
});
test('note inputs reject objects and oversized lists', () => {
  assert.equal(isText({ value: 'text' }), false);
  assert.equal(isText('   '), false);
  assert.equal(stringList(new Array(101).fill('tag')), false);
});
test('AI responses must contain real, valid cards instead of silent placeholders', () => {
  for (const response of ['invalid', '[]', '[{"front":"Question"}]', '[{"front":{},"back":"Answer"}]']) assert.throws(() => parseFlashcards(response));
  assert.deepEqual(parseFlashcards('```json\n[{"front":" What? ","back":" Answer "}]\n```'), [{front:'What?',back:'Answer'}]);
});
