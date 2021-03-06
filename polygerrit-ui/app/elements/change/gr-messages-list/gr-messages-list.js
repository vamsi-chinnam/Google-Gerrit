/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
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
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../shared/gr-button/gr-button.js';
import '../../shared/gr-icons/gr-icons.js';
import '../gr-message/gr-message.js';
import '../../../styles/shared-styles.js';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import {LegacyElementMixin} from '@polymer/polymer/lib/legacy/legacy-element-mixin.js';
import {PolymerElement} from '@polymer/polymer/polymer-element.js';
import {htmlTemplate} from './gr-messages-list_html.js';
import {
  KeyboardShortcutMixin,
  Shortcut, ShortcutSection,
} from '../../../mixins/keyboard-shortcut-mixin/keyboard-shortcut-mixin.js';
import {parseDate} from '../../../utils/date-util.js';
import {MessageTag} from '../../../constants/constants.js';
import {appContext} from '../../../services/app-context.js';

/**
 * The content of the enum is also used in the UI for the button text.
 *
 * @enum {string}
 */
const ExpandAllState = {
  EXPAND_ALL: 'Expand All',
  COLLAPSE_ALL: 'Collapse All',
};

/**
 * Computes message author's comments for this change message. The backend
 * sets comment.change_message_id for matching, so this computation is fairly
 * straightforward.
 */
function computeThreads(message, allMessages, changeComments) {
  if ([message, allMessages, changeComments].includes(undefined)) {
    return [];
  }
  if (message._index === undefined) {
    return [];
  }

  return changeComments.getAllThreadsForChange().filter(
      thread => thread.comments.map(comment => {
        // collapse all by default
        comment.collapsed = true;
        return comment;
      }).some(comment => {
        const condition = comment.change_message_id === message.id;
        // Since getAllThreadsForChange() always returns a new copy of
        // all comments we can modify them here without worrying about
        // polluting other threads.
        comment.collapsed = !condition;
        return condition;
      })
  );
}

/**
 * If messages have the same tag, then that influences grouping and whether
 * a message is initally hidden or not, see isImportant(). So we are applying
 * some "magic" rules here in order to hide exactly the right messages.
 *
 * 1. If a message does not have a tag, but is associated with robot comments,
 * then it gets a tag.
 *
 * 2. Use the same tag for some of Gerrit's standard events, if they should be
 * considered one group, e.g. normal and wip patchset uploads.
 *
 * 3. Everything beyond the ~ character is cut off from the tag. That gives
 * tools control over which messages will be hidden.
 */
function computeTag(message) {
  if (!message.tag) {
    const threads = message.commentThreads || [];
    const comments = threads.map(
        t => t.comments.find(c => c.change_message_id === message.id));
    const isRobot = comments.some(c => c && !!c.robot_id);
    return isRobot ? 'autogenerated:has-robot-comments' : undefined;
  }

  if (message.tag === MessageTag.TAG_NEW_WIP_PATCHSET) {
    return MessageTag.TAG_NEW_PATCHSET;
  }
  if (message.tag === MessageTag.TAG_UNSET_ASSIGNEE) {
    return MessageTag.TAG_SET_ASSIGNEE;
  }
  if (message.tag === MessageTag.TAG_UNSET_PRIVATE) {
    return MessageTag.TAG_SET_PRIVATE;
  }
  if (message.tag === MessageTag.TAG_SET_WIP) {
    return MessageTag.TAG_SET_READY;
  }

  return message.tag.replace(/~.*/, '');
}

/**
 * Try to set a revision number that makes sense, if none is set. Just copy
 * over the revision number of the next older message. This is mostly relevant
 * for reviewer updates. Other messages should typically have the revision
 * number already set.
 */
function computeRevision(message, allMessages) {
  if (message._revision_number > 0) return message._revision_number;
  let revision = 0;
  for (const m of allMessages) {
    if (m.date > message.date) break;
    if (m._revision_number > revision) revision = m._revision_number;
  }
  return revision > 0 ? revision : undefined;
}

/**
 * Unimportant messages are initially hidden.
 *
 * Human messages are always important. They have an undefined tag.
 *
 * Autogenerated messages are unimportant, if there is a message with the same
 * tag and a higher revision number.
 */
function computeIsImportant(message, allMessages) {
  if (!message.tag) return true;

  const hasSameTag = m => m.tag === message.tag;
  const revNumber = message._revision_number || 0;
  const hasHigherRevisionNumber = m => m._revision_number > revNumber;
  return !allMessages.filter(hasSameTag).some(hasHigherRevisionNumber);
}

export const TEST_ONLY = {
  computeThreads,
  computeTag,
  computeRevision,
  computeIsImportant,
};

/**
 * @extends PolymerElement
 */
class GrMessagesList extends KeyboardShortcutMixin(
    GestureEventListeners(
        LegacyElementMixin(
            PolymerElement))) {
  static get template() { return htmlTemplate; }

  static get is() { return 'gr-messages-list'; }

  static get properties() {
    return {
      /** @type {?} */
      change: Object,
      changeNum: Number,
      /**
       * These are just the change messages. They are combined with reviewer
       * updates below. So _combinedMessages is the more important property.
       */
      messages: {
        type: Array,
        value() { return []; },
      },
      /**
       * These are just the reviewer updates. They are combined with change
       * messages above. So _combinedMessages is the more important property.
       */
      reviewerUpdates: {
        type: Array,
        value() { return []; },
      },
      changeComments: Object,
      projectName: String,
      showReplyButtons: {
        type: Boolean,
        value: false,
      },
      labels: Object,

      /**
       * Keeps track of the state of the "Expand All" toggle button. Note that
       * you can individually expand/collapse some messages without affecting
       * the toggle button's state.
       *
       * @type {ExpandAllState}
       */
      _expandAllState: {
        type: String,
        value: ExpandAllState.EXPAND_ALL,
      },
      _expandAllTitle: {
        type: String,
        computed: '_computeExpandAllTitle(_expandAllState)',
      },

      _showAllActivity: {
        type: Boolean,
        value: false,
        observer: '_observeShowAllActivity',
      },
      /**
       * The merged array of change messages and reviewer updates.
       */
      _combinedMessages: {
        type: Array,
        computed: '_computeCombinedMessages(messages, reviewerUpdates, '
            + 'changeComments)',
        observer: '_combinedMessagesChanged',
      },

      _labelExtremes: {
        type: Object,
        computed: '_computeLabelExtremes(labels.*)',
      },
    };
  }

  constructor() {
    super();
    this.reporting = appContext.reportingService;
  }

  scrollToMessage(messageID) {
    const selector = `[data-message-id="${messageID}"]`;
    const el = this.shadowRoot.querySelector(selector);

    if (!el && this._showAllActivity) {
      console.warn(`Failed to scroll to message: ${messageID}`);
      return;
    }
    if (!el) {
      this._showAllActivity = true;
      setTimeout(() => this.scrollToMessage(messageID));
      return;
    }

    el.set('message.expanded', true);
    let top = el.offsetTop;
    for (let offsetParent = el.offsetParent;
      offsetParent;
      offsetParent = offsetParent.offsetParent) {
      top += offsetParent.offsetTop;
    }
    window.scrollTo(0, top);
    this._highlightEl(el);
  }

  _observeShowAllActivity(showAllActivity) {
    // We have to call render() such that the dom-repeat filter picks up the
    // change.
    this.$.messageRepeat.render();
  }

  /**
   * Filter for the dom-repeat of combinedMessages.
   */
  _isMessageVisible(message) {
    return this._showAllActivity || message.isImportant;
  }

  /**
   * Merges change messages and reviewer updates into one array. Also processes
   * all messages and updates, aligns or massages some of the properties.
   */
  _computeCombinedMessages(messages, reviewerUpdates, changeComments) {
    const params = [messages, reviewerUpdates, changeComments];
    if (params.some(o => o === undefined)) return [];

    let mi = 0;
    let ri = 0;
    let combinedMessages = [];
    let mDate;
    let rDate;
    for (let i = 0; i < messages.length; i++) {
      messages[i]._index = i;
    }

    while (mi < messages.length || ri < reviewerUpdates.length) {
      if (mi >= messages.length) {
        combinedMessages = combinedMessages.concat(reviewerUpdates.slice(ri));
        break;
      }
      if (ri >= reviewerUpdates.length) {
        combinedMessages = combinedMessages.concat(messages.slice(mi));
        break;
      }
      mDate = mDate || parseDate(messages[mi].date);
      rDate = rDate || parseDate(reviewerUpdates[ri].date);
      if (rDate < mDate) {
        combinedMessages.push(reviewerUpdates[ri++]);
        rDate = null;
      } else {
        combinedMessages.push(messages[mi++]);
        mDate = null;
      }
    }
    combinedMessages.forEach(m => {
      if (m.expanded === undefined) {
        m.expanded = false;
      }
      m.commentThreads = computeThreads(m, combinedMessages, changeComments);
      m._revision_number = computeRevision(m, combinedMessages);
      m.tag = computeTag(m);
    });
    // computeIsImportant() depends on tags and revision numbers already being
    // updated for all messages, so we have to compute this in its own forEach
    // loop.
    combinedMessages.forEach(m => {
      m.isImportant = computeIsImportant(m, combinedMessages);
    });
    return combinedMessages;
  }

  _updateExpandedStateOfAllMessages(exp) {
    if (this._combinedMessages) {
      for (let i = 0; i < this._combinedMessages.length; i++) {
        this._combinedMessages[i].expanded = exp;
        this.notifyPath(`_combinedMessages.${i}.expanded`);
      }
    }
  }

  _computeExpandAllTitle(_expandAllState) {
    if (_expandAllState === ExpandAllState.COLLAPSE_ALL) {
      return this.createTitle(
          Shortcut.COLLAPSE_ALL_MESSAGES, ShortcutSection.ACTIONS);
    }
    if (_expandAllState === ExpandAllState.EXPAND_ALL) {
      return this.createTitle(
          Shortcut.EXPAND_ALL_MESSAGES, ShortcutSection.ACTIONS);
    }
    return '';
  }

  _highlightEl(el) {
    const highlightedEls =
        this.root.querySelectorAll('.highlighted');
    for (const highlightedEl of highlightedEls) {
      highlightedEl.classList.remove('highlighted');
    }
    function handleAnimationEnd() {
      el.removeEventListener('animationend', handleAnimationEnd);
      el.classList.remove('highlighted');
    }
    el.addEventListener('animationend', handleAnimationEnd);
    el.classList.add('highlighted');
  }

  /**
   * @param {boolean} expand
   */
  handleExpandCollapse(expand) {
    this._expandAllState = expand ? ExpandAllState.COLLAPSE_ALL
      : ExpandAllState.EXPAND_ALL;
    this._updateExpandedStateOfAllMessages(expand);
  }

  _handleExpandCollapseTap(e) {
    e.preventDefault();
    this.handleExpandCollapse(
        this._expandAllState === ExpandAllState.EXPAND_ALL);
  }

  _handleAnchorClick(e) {
    this.scrollToMessage(e.detail.id);
  }

  _isVisibleShowAllActivityToggle(messages = []) {
    return messages.some(m => !m.isImportant);
  }

  _computeHiddenEntriesCount(messages = []) {
    return messages.filter(m => !m.isImportant).length;
  }

  /**
   * This method is for reporting stats only.
   */
  _combinedMessagesChanged(combinedMessages) {
    if (combinedMessages) {
      if (combinedMessages.length === 0) return;
      const tags = combinedMessages.map(
          message => message.tag || message.type ||
              (message.comments ? 'comments' : 'none'));
      const tagsCounted = tags.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {all: combinedMessages.length});
      this.reporting.reportInteraction('messages-count', tagsCounted);
    }
  }

  /**
   * Compute a mapping from label name to objects representing the minimum and
   * maximum possible values for that label.
   */
  _computeLabelExtremes(labelRecord) {
    const extremes = {};
    const labels = labelRecord.base;
    if (!labels) { return extremes; }
    for (const key of Object.keys(labels)) {
      if (!labels[key] || !labels[key].values) { continue; }
      const values = Object.keys(labels[key].values)
          .map(v => parseInt(v, 10));
      values.sort((a, b) => a - b);
      if (!values.length) { continue; }
      extremes[key] = {min: values[0], max: values[values.length - 1]};
    }
    return extremes;
  }

  /**
   * Work around a issue on iOS when clicking turns into double tap
   */
  _onTapShowAllActivityToggle(e) {
    e.preventDefault();
  }
}

customElements.define(GrMessagesList.is,
    GrMessagesList);
