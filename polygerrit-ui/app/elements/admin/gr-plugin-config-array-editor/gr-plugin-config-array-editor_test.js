/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../../../test/common-test-setup-karma.js';
import './gr-plugin-config-array-editor.js';

const basicFixture = fixtureFromElement('gr-plugin-config-array-editor');

suite('gr-plugin-config-array-editor tests', () => {
  let element;

  let dispatchStub;

  const getAll = str => element.root.querySelectorAll(str);

  setup(() => {
    element = basicFixture.instantiate();
    element.pluginOption = {
      _key: 'test-key',
      info: {
        values: [],
      },
    };
  });

  test('_computeShowInputRow', () => {
    assert.equal(element._computeShowInputRow(true), 'hide');
    assert.equal(element._computeShowInputRow(false), '');
  });

  test('_computeDisabled', () => {
    assert.isTrue(element._computeDisabled({}));
    assert.isTrue(element._computeDisabled({base: {}}));
    assert.isTrue(element._computeDisabled({base: {info: {}}}));
    assert.isTrue(
        element._computeDisabled({base: {info: {editable: false}}}));
    assert.isFalse(
        element._computeDisabled({base: {info: {editable: true}}}));
  });

  suite('adding', () => {
    setup(() => {
      dispatchStub = sinon.stub(element, '_dispatchChanged');
    });

    test('with enter', () => {
      element._newValue = '';
      MockInteractions.pressAndReleaseKeyOn(element.$.input, 13); // Enter
      flushAsynchronousOperations();

      assert.isFalse(dispatchStub.called);
      element._newValue = 'test';
      MockInteractions.pressAndReleaseKeyOn(element.$.input, 13); // Enter
      flushAsynchronousOperations();

      assert.isTrue(dispatchStub.called);
      assert.equal(dispatchStub.lastCall.args[0], 'test');
      assert.equal(element._newValue, '');
    });

    test('with add btn', () => {
      element._newValue = '';
      MockInteractions.tap(element.$.addButton);
      flushAsynchronousOperations();

      assert.isFalse(dispatchStub.called);
      element._newValue = 'test';
      MockInteractions.tap(element.$.addButton);
      flushAsynchronousOperations();

      assert.isTrue(dispatchStub.called);
      assert.equal(dispatchStub.lastCall.args[0], 'test');
      assert.equal(element._newValue, '');
    });
  });

  test('deleting', () => {
    dispatchStub = sinon.stub(element, '_dispatchChanged');
    element.pluginOption = {info: {values: ['test', 'test2']}};
    flushAsynchronousOperations();

    const rows = getAll('.existingItems .row');
    assert.equal(rows.length, 2);
    const button = rows[0].querySelector('gr-button');

    MockInteractions.tap(button);
    flushAsynchronousOperations();

    assert.isFalse(dispatchStub.called);
    element.pluginOption.info.editable = true;
    element.notifyPath('pluginOption.info.editable');
    flushAsynchronousOperations();

    MockInteractions.tap(button);
    flushAsynchronousOperations();

    assert.isTrue(dispatchStub.called);
    assert.deepEqual(dispatchStub.lastCall.args[0], ['test2']);
  });

  test('_dispatchChanged', () => {
    const eventStub = sinon.stub(element, 'dispatchEvent');
    element._dispatchChanged(['new-test-value']);

    assert.isTrue(eventStub.called);
    const {detail} = eventStub.lastCall.args[0];
    assert.equal(detail._key, 'test-key');
    assert.deepEqual(detail.info, {values: ['new-test-value']});
    assert.equal(detail.notifyPath, 'test-key.values');
  });
});

