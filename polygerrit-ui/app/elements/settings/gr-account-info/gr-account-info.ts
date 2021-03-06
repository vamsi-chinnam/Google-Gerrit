/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
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
import '@polymer/iron-input/iron-input';
import '../../shared/gr-avatar/gr-avatar';
import '../../shared/gr-date-formatter/gr-date-formatter';
import '../../shared/gr-rest-api-interface/gr-rest-api-interface';
import '../../../styles/gr-form-styles';
import '../../../styles/shared-styles';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners';
import {LegacyElementMixin} from '@polymer/polymer/lib/legacy/legacy-element-mixin';
import {PolymerElement} from '@polymer/polymer/polymer-element';
import {htmlTemplate} from './gr-account-info_html';
import {customElement, property, observe} from '@polymer/decorators';
import {AccountInfo, ServerInfo} from '../../../types/common';
import {RestApiService} from '../../../services/services/gr-rest-api/gr-rest-api';

export interface GrAccountInfo {
  $: {
    restAPI: RestApiService & Element;
  };
}
@customElement('gr-account-info')
export class GrAccountInfo extends GestureEventListeners(
  LegacyElementMixin(PolymerElement)
) {
  static get template() {
    return htmlTemplate;
  }

  /**
   * Fired when account details are changed.
   *
   * @event account-detail-update
   */

  @property({
    type: Boolean,
    notify: true,
    computed: '_computeUsernameMutable(_serverConfig, _account.username)',
  })
  usernameMutable?: boolean;

  @property({
    type: Boolean,
    notify: true,
    computed: '_computeNameMutable(_serverConfig)',
  })
  nameMutable?: boolean;

  @property({
    type: Boolean,
    notify: true,
    computed:
      '_computeHasUnsavedChanges(_hasNameChange, ' +
      '_hasUsernameChange, _hasStatusChange, _hasDisplayNameChange)',
  })
  hasUnsavedChanges?: boolean;

  @property({type: Boolean})
  _hasNameChange?: boolean;

  @property({type: Boolean})
  _hasUsernameChange?: boolean;

  @property({type: Boolean})
  _hasDisplayNameChange?: boolean;

  @property({type: Boolean})
  _hasStatusChange?: boolean;

  @property({type: Boolean})
  _loading = false;

  @property({type: Boolean})
  _saving = false;

  @property({type: Object})
  _account?: AccountInfo;

  @property({type: Object})
  _serverConfig?: ServerInfo;

  @property({type: String, observer: '_usernameChanged'})
  _username?: string;

  @property({type: String})
  _avatarChangeUrl = '';

  loadData() {
    const promises = [];

    this._loading = true;

    promises.push(
      this.$.restAPI.getConfig().then(config => {
        this._serverConfig = config;
      })
    );

    promises.push(
      this.$.restAPI.getAccount().then(account => {
        if (!account) return;
        this._hasNameChange = false;
        this._hasUsernameChange = false;
        this._hasDisplayNameChange = false;
        this._hasStatusChange = false;
        // Provide predefined value for username to trigger computation of
        // username mutability.
        account.username = account.username || '';
        this._account = account;
        this._username = account.username;
      })
    );

    promises.push(
      this.$.restAPI.getAvatarChangeUrl().then(url => {
        this._avatarChangeUrl = url || '';
      })
    );

    return Promise.all(promises).then(() => {
      this._loading = false;
    });
  }

  save() {
    if (!this.hasUnsavedChanges) {
      return Promise.resolve();
    }

    this._saving = true;
    // Set only the fields that have changed.
    // Must be done in sequence to avoid race conditions (@see Issue 5721)
    return this._maybeSetName()
      .then(() => this._maybeSetUsername())
      .then(() => this._maybeSetDisplayName())
      .then(() => this._maybeSetStatus())
      .then(() => {
        this._hasNameChange = false;
        this._hasDisplayNameChange = false;
        this._hasStatusChange = false;
        this._saving = false;
        this.dispatchEvent(
          new CustomEvent('account-detail-update', {
            composed: true,
            bubbles: true,
          })
        );
      });
  }

  _maybeSetName() {
    return this._hasNameChange && this.nameMutable && this._account?.name
      ? this.$.restAPI.setAccountName(this._account.name)
      : Promise.resolve();
  }

  _maybeSetUsername() {
    return this._hasUsernameChange && this.usernameMutable && this._username
      ? this.$.restAPI.setAccountUsername(this._username)
      : Promise.resolve();
  }

  _maybeSetDisplayName() {
    return this._hasDisplayNameChange && this._account?.display_name
      ? this.$.restAPI.setAccountDisplayName(this._account.display_name)
      : Promise.resolve();
  }

  _maybeSetStatus() {
    return this._hasStatusChange && this._account?.status
      ? this.$.restAPI.setAccountStatus(this._account.status)
      : Promise.resolve();
  }

  _computeHasUnsavedChanges(
    nameChanged: boolean,
    usernameChanged: boolean,
    statusChanged: boolean,
    displayNameChanged: boolean
  ) {
    return (
      nameChanged || usernameChanged || statusChanged || displayNameChanged
    );
  }

  _computeUsernameMutable(config: ServerInfo, username?: string) {
    // Polymer 2: check for undefined
    if ([config, username].includes(undefined)) {
      return undefined;
    }

    // Username may not be changed once it is set.
    return (
      config.auth.editable_account_fields.includes('USER_NAME') && !username
    );
  }

  _computeNameMutable(config: ServerInfo) {
    return config.auth.editable_account_fields.includes('FULL_NAME');
  }

  @observe('_account.status')
  _statusChanged() {
    if (this._loading) {
      return;
    }
    this._hasStatusChange = true;
  }

  @observe('_account.display_name')
  _displayNameChanged() {
    if (this._loading) {
      return;
    }
    this._hasDisplayNameChange = true;
  }

  _usernameChanged() {
    if (this._loading || !this._account) {
      return;
    }
    this._hasUsernameChange =
      (this._account.username || '') !== (this._username || '');
  }

  @observe('_account.name')
  _nameChanged() {
    if (this._loading) {
      return;
    }
    this._hasNameChange = true;
  }

  _handleKeydown(e: KeyboardEvent) {
    if (e.keyCode === 13) {
      // Enter
      e.stopPropagation();
      this.save();
    }
  }

  _hideAvatarChangeUrl(avatarChangeUrl: string) {
    if (!avatarChangeUrl) {
      return 'hide';
    }

    return '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-account-info': GrAccountInfo;
  }
}
