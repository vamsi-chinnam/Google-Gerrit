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

import {
  AccountDetailInfo,
  AccountExternalIdInfo,
  AccountInfo,
  NumericChangeId,
  ServerInfo,
  ProjectInfo,
  ActionInfo,
  AccountCapabilityInfo,
  SuggestedReviewerInfo,
  GroupNameToGroupInfoMap,
  ParsedJSON,
  PatchSetNum,
  RequestPayload,
  PreferencesInput,
  DiffPreferencesInfo,
  EditPreferencesInfo,
  DiffPreferenceInput,
  SshKeyInfo,
  RepoName,
  BranchName,
  BranchInput,
  TagInput,
  GpgKeysInput,
  GpgKeyId,
  GpgKeyInfo,
  PreferencesInfo,
  EmailInfo,
  ProjectAccessInfo,
  CapabilityInfoMap,
  ProjectAccessInput,
  ChangeInfo,
  ProjectInfoWithName,
  GroupId,
  GroupInfo,
  GroupOptionsInput,
  BranchInfo,
  ConfigInfo,
  ReviewInput,
  EditInfo,
  ChangeId,
  DashboardInfo,
  ProjectAccessInfoMap,
  IncludedInInfo,
  RobotCommentInfo,
  CommentInfo,
  PathToCommentsInfoMap,
  PathToRobotCommentsInfoMap,
  CommentInput,
  GroupInput,
  PluginInfo,
  DocResult,
  ContributorAgreementInfo,
  ContributorAgreementInput,
  Password,
  ProjectWatchInfo,
  NameToProjectInfoMap,
  ProjectInput,
  AccountId,
} from '../../../types/common';
import {ParsedChangeInfo} from '../../../elements/shared/gr-rest-api-interface/gr-reviewer-updates-parser';
import {HttpMethod} from '../../../constants/constants';
import {ChangeNum} from '../../../elements/shared/gr-rest-api-interface/gr-rest-api-interface';

export type ErrorCallback = (response?: Response | null, err?: Error) => void;
export type CancelConditionCallback = () => boolean;

// TODO(TS): remove when GrReplyDialog converted to typescript
export interface GrReplyDialog {
  getLabelValue(label: string): string;
  setLabelValue(label: string, value: string): void;
  send(includeComments?: boolean, startReview?: boolean): Promise<unknown>;
  setPluginMessage(message: string): void;
}

// Copied from gr-change-actions.js
export enum ActionType {
  CHANGE = 'change',
  REVISION = 'revision',
}

// Copied from gr-change-actions.js
export enum ActionPriority {
  CHANGE = 2,
  DEFAULT = 0,
  PRIMARY = 3,
  REVIEW = -3,
  REVISION = 1,
}

// TODO(TS) remove interface when GrChangeActions is converted to typescript
export interface GrChangeActions extends Element {
  RevisionActions?: Record<string, string>;
  ChangeActions: Record<string, string>;
  ActionType: Record<string, string>;
  primaryActionKeys: string[];
  push(propName: 'primaryActionKeys', value: string): void;
  hideQuickApproveAction(): void;
  setActionOverflow(type: ActionType, key: string, overflow: boolean): void;
  setActionPriority(
    type: ActionType,
    key: string,
    overflow: ActionPriority
  ): void;
  setActionHidden(type: ActionType, key: string, hidden: boolean): void;
  addActionButton(type: ActionType, label: string): string;
  removeActionButton(key: string): void;
  setActionButtonProp(key: string, prop: string, value: string): void;
  getActionDetails(actionName: string): ActionInfo;
}

export interface GetDiffCommentsOutput {
  baseComments: CommentInfo[];
  comments: CommentInfo[];
}

export interface GetDiffRobotCommentsOutput {
  baseComments: RobotCommentInfo[];
  comments: RobotCommentInfo[];
}

export interface RestApiService {
  // TODO(TS): unclear what is a second parameter. Looks like it is a mistake
  // and it must be removed
  dispatchEvent(event: Event, detail?: unknown): boolean;
  getConfig(noCache?: boolean): Promise<ServerInfo | undefined>;
  getLoggedIn(): Promise<boolean>;
  getPreferences(): Promise<PreferencesInfo | undefined>;
  getVersion(): Promise<string | undefined>;
  getAccount(): Promise<AccountDetailInfo | undefined>;
  getAccountCapabilities(
    params?: string[]
  ): Promise<AccountCapabilityInfo | undefined>;
  getExternalIds(): Promise<AccountExternalIdInfo[] | undefined>;
  deleteAccountIdentity(id: string[]): Promise<unknown>;
  getRepos(
    filter: string | undefined,
    reposPerPage: number,
    offset?: number
  ): Promise<ProjectInfoWithName[] | undefined>;

  send(
    method: HttpMethod,
    url: string,
    body?: RequestPayload,
    errFn?: null | undefined,
    contentType?: string,
    headers?: Record<string, string>
  ): Promise<Response>;

  send(
    method: HttpMethod,
    url: string,
    body?: RequestPayload,
    errFn?: ErrorCallback,
    contentType?: string,
    headers?: Record<string, string>
  ): Promise<Response | void>;

  getResponseObject(response: Response): Promise<ParsedJSON>;

  getChangeSuggestedReviewers(
    changeNum: NumericChangeId,
    input: string,
    errFn?: ErrorCallback
  ): Promise<SuggestedReviewerInfo[] | undefined>;
  getChangeSuggestedCCs(
    changeNum: NumericChangeId,
    input: string,
    errFn?: ErrorCallback
  ): Promise<SuggestedReviewerInfo[] | undefined>;
  getSuggestedAccounts(
    input: string,
    n?: number,
    errFn?: ErrorCallback
  ): Promise<AccountInfo[] | undefined>;
  getSuggestedGroups(
    input: string,
    n?: number,
    errFn?: ErrorCallback
  ): Promise<GroupNameToGroupInfoMap | undefined>;
  executeChangeAction(
    changeNum: ChangeNum,
    method: HttpMethod,
    endpoint: string,
    patchNum?: PatchSetNum,
    payload?: RequestPayload,
    errFn?: ErrorCallback
  ): Promise<Response | undefined>;
  getRepoBranches(
    filter: string,
    repo: RepoName,
    reposBranchesPerPage: number,
    offset?: number,
    errFn?: ErrorCallback
  ): Promise<BranchInfo[] | undefined>;

  getChangeDetail(
    changeNum: number | string,
    opt_errFn?: Function,
    opt_cancelCondition?: Function
  ): Promise<ParsedChangeInfo | null | undefined>;

  savePreferences(prefs: PreferencesInput): Promise<Response>;

  getDiffPreferences(): Promise<DiffPreferencesInfo | undefined>;

  saveDiffPreferences(prefs: DiffPreferenceInput): Promise<Response>;
  saveDiffPreferences(
    prefs: DiffPreferenceInput,
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  saveDiffPreferences(
    prefs: DiffPreferenceInput,
    errFn?: ErrorCallback
  ): Promise<Response>;

  getEditPreferences(): Promise<EditPreferencesInfo | undefined>;

  saveEditPreferences(prefs: EditPreferencesInfo): Promise<Response>;
  saveEditPreferences(
    prefs: EditPreferencesInfo,
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  saveEditPreferences(
    prefs: EditPreferencesInfo,
    errFn?: ErrorCallback
  ): Promise<Response>;

  getAccountEmails(): Promise<EmailInfo[] | undefined>;
  deleteAccountEmail(email: string): Promise<Response>;
  setPreferredAccountEmail(email: string, errFn?: ErrorCallback): Promise<void>;

  getAccountSSHKeys(): Promise<SshKeyInfo[] | undefined>;
  deleteAccountSSHKey(key: string): void;
  addAccountSSHKey(key: string): Promise<SshKeyInfo>;

  createRepoBranch(
    name: RepoName,
    branch: BranchName,
    revision: BranchInput
  ): Promise<Response>;

  createRepoBranch(
    name: RepoName,
    branch: BranchName,
    revision: BranchInput,
    errFn: ErrorCallback
  ): Promise<Response | undefined>;

  createRepoTag(
    name: RepoName,
    tag: string,
    revision: TagInput
  ): Promise<Response>;

  createRepoTag(
    name: RepoName,
    tag: string,
    revision: TagInput,
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  addAccountGPGKey(key: GpgKeysInput): Promise<Record<string, GpgKeyInfo>>;
  deleteAccountGPGKey(id: GpgKeyId): Promise<Response>;
  getAccountGPGKeys(): Promise<Record<string, GpgKeyInfo>>;
  probePath(path: string): Promise<boolean>;

  saveFileUploadChangeEdit(
    changeNum: ChangeNum,
    path: string,
    content: string
  ): Promise<Response | undefined>;

  deleteFileInChangeEdit(
    changeNum: ChangeNum,
    path: string
  ): Promise<Response | undefined>;

  restoreFileInChangeEdit(
    changeNum: ChangeNum,
    restore_path: string
  ): Promise<Response | undefined>;

  renameFileInChangeEdit(
    changeNum: ChangeNum,
    old_path: string,
    new_path: string
  ): Promise<Response | undefined>;

  queryChangeFiles(
    changeNum: ChangeNum,
    patchNum: PatchSetNum,
    query: string
  ): Promise<string[] | undefined>;

  getRepoAccessRights(
    repoName: RepoName,
    errFn?: ErrorCallback
  ): Promise<ProjectAccessInfo | undefined>;

  createRepo(config: ProjectInput & {name: RepoName}): Promise<Response>;
  createRepo(
    config: ProjectInput & {name: RepoName},
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  createRepo(config: ProjectInput, errFn?: ErrorCallback): Promise<Response>;

  getRepo(
    repo: RepoName,
    errFn?: ErrorCallback
  ): Promise<ProjectInfo | undefined>;

  getRepoDashboards(
    repo: RepoName,
    errFn?: ErrorCallback
  ): Promise<DashboardInfo[] | undefined>;

  getRepoAccess(repo: RepoName): Promise<ProjectAccessInfoMap | undefined>;

  getProjectConfig(
    repo: RepoName,
    errFn?: ErrorCallback
  ): Promise<ConfigInfo | undefined>;

  getCapabilities(
    errFn?: ErrorCallback
  ): Promise<CapabilityInfoMap | undefined>;

  setRepoAccessRights(
    repoName: RepoName,
    repoInfo: ProjectAccessInput
  ): Promise<Response>;

  setRepoAccessRightsForReview(
    projectName: RepoName,
    projectInfo: ProjectAccessInput
  ): Promise<ChangeInfo>;

  getGroups(
    filter: string,
    groupsPerPage: number,
    offset?: number
  ): Promise<GroupNameToGroupInfoMap | undefined>;

  getGroupConfig(
    group: GroupId,
    errFn?: ErrorCallback
  ): Promise<GroupInfo | undefined>;

  getIsAdmin(): Promise<boolean | undefined>;

  getIsGroupOwner(groupName: GroupId): Promise<boolean>;

  saveGroupName(groupId: GroupId, name: string): Promise<Response>;

  saveGroupOwner(groupId: GroupId, ownerId: string): Promise<Response>;

  saveGroupDescription(
    groupId: GroupId,
    description: string
  ): Promise<Response>;

  saveGroupOptions(
    groupId: GroupId,
    options: GroupOptionsInput
  ): Promise<Response>;

  saveChangeReview(
    changeNum: ChangeNum,
    patchNum: PatchSetNum,
    review: ReviewInput
  ): Promise<Response>;
  saveChangeReview(
    changeNum: ChangeNum,
    patchNum: PatchSetNum,
    review: ReviewInput,
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  saveChangeReview(
    changeNum: ChangeNum,
    patchNum: PatchSetNum,
    review: ReviewInput,
    errFn?: ErrorCallback
  ): Promise<Response>;

  getChangeEdit(
    changeNum: ChangeNum,
    downloadCommands?: boolean
  ): Promise<false | EditInfo | undefined>;

  createChange(
    project: RepoName,
    branch: BranchName,
    subject: string,
    topic?: string,
    isPrivate?: boolean,
    workInProgress?: boolean,
    baseChange?: ChangeId,
    baseCommit?: string
  ): Promise<ChangeInfo | undefined>;

  getChangeIncludedIn(
    changeNum: ChangeNum
  ): Promise<IncludedInInfo | undefined>;

  getFromProjectLookup(changeNum: ChangeNum): Promise<RepoName | undefined>;

  saveDiffDraft(
    changeNum: ChangeNum,
    patchNum: PatchSetNum,
    draft: CommentInput
  ): Promise<Response>;

  getDiffChangeDetail(
    changeNum: ChangeNum,
    errFn?: ErrorCallback,
    cancelCondition?: CancelConditionCallback
  ): Promise<ChangeInfo | undefined | null>;

  getDiffComments(
    changeNum: ChangeNum
  ): Promise<PathToCommentsInfoMap | undefined>;
  getDiffComments(
    changeNum: ChangeNum,
    basePatchNum: PatchSetNum,
    patchNum: PatchSetNum,
    path: string
  ): Promise<GetDiffCommentsOutput>;
  getDiffComments(
    changeNum: ChangeNum,
    basePatchNum?: PatchSetNum,
    patchNum?: PatchSetNum,
    path?: string
  ):
    | Promise<PathToCommentsInfoMap | undefined>
    | Promise<GetDiffCommentsOutput>;

  getDiffRobotComments(
    changeNum: ChangeNum
  ): Promise<PathToRobotCommentsInfoMap | undefined>;
  getDiffRobotComments(
    changeNum: ChangeNum,
    basePatchNum: PatchSetNum,
    patchNum: PatchSetNum,
    path: string
  ): Promise<GetDiffRobotCommentsOutput>;
  getDiffRobotComments(
    changeNum: ChangeNum,
    basePatchNum?: PatchSetNum,
    patchNum?: PatchSetNum,
    path?: string
  ):
    | Promise<GetDiffRobotCommentsOutput>
    | Promise<PathToRobotCommentsInfoMap | undefined>;

  getDiffDrafts(
    changeNum: ChangeNum
  ): Promise<PathToCommentsInfoMap | undefined>;
  getDiffDrafts(
    changeNum: ChangeNum,
    basePatchNum: PatchSetNum,
    patchNum: PatchSetNum,
    path: string
  ): Promise<GetDiffCommentsOutput>;
  getDiffDrafts(
    changeNum: ChangeNum,
    basePatchNum?: PatchSetNum,
    patchNum?: PatchSetNum,
    path?: string
  ):
    | Promise<GetDiffCommentsOutput>
    | Promise<PathToCommentsInfoMap | undefined>;

  createGroup(config: GroupInput & {name: string}): Promise<Response>;
  createGroup(
    config: GroupInput & {name: string},
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  createGroup(config: GroupInput, errFn?: ErrorCallback): Promise<Response>;

  getPlugins(
    filter: string,
    pluginsPerPage: number,
    offset?: number,
    errFn?: ErrorCallback
  ): Promise<{[pluginName: string]: PluginInfo} | undefined>;

  getChanges(
    changesPerPage?: number,
    query?: string,
    offset?: 'n,z' | number,
    options?: string
  ): Promise<ChangeInfo[] | undefined>;
  getChanges(
    changesPerPage?: number,
    query?: string[],
    offset?: 'n,z' | number,
    options?: string
  ): Promise<ChangeInfo[][] | undefined>;
  /**
   * @return If opt_query is an
   * array, _fetchJSON will return an array of arrays of changeInfos. If it
   * is unspecified or a string, _fetchJSON will return an array of
   * changeInfos.
   */
  getChanges(
    changesPerPage?: number,
    query?: string | string[],
    offset?: 'n,z' | number,
    options?: string
  ): Promise<ChangeInfo[] | ChangeInfo[][] | undefined>;

  getDocumentationSearches(filter: string): Promise<DocResult[] | undefined>;

  getAccountAgreements(): Promise<ContributorAgreementInfo[] | undefined>;

  getAccountGroups(): Promise<GroupInfo[] | undefined>;

  saveAccountAgreement(name: ContributorAgreementInput): Promise<Response>;

  generateAccountHttpPassword(): Promise<Password>;

  setAccountName(name: string, errFn?: ErrorCallback): Promise<void>;

  setAccountUsername(username: string, errFn?: ErrorCallback): Promise<void>;

  getWatchedProjects(): Promise<ProjectWatchInfo[] | undefined>;

  saveWatchedProjects(
    projects: ProjectWatchInfo[],
    errFn?: ErrorCallback
  ): Promise<ProjectWatchInfo[]>;

  deleteWatchedProjects(
    projects: ProjectWatchInfo[]
  ): Promise<Response | undefined>;
  deleteWatchedProjects(
    projects: ProjectWatchInfo[],
    errFn: ErrorCallback
  ): Promise<Response | undefined>;
  deleteWatchedProjects(
    projects: ProjectWatchInfo[],
    errFn?: ErrorCallback
  ): Promise<Response | undefined>;

  getSuggestedProjects(
    inputVal: string,
    n?: number,
    errFn?: ErrorCallback
  ): Promise<NameToProjectInfoMap | undefined>;

  invalidateGroupsCache(): void;
  invalidateReposCache(): void;
  invalidateAccountsCache(): void;
  removeFromAttentionSet(
    changeNum: ChangeNum,
    user: AccountId,
    reason: string
  ): Promise<Response>;
  addToAttentionSet(
    changeNum: ChangeNum,
    user: AccountId | undefined | null,
    reason: string
  ): Promise<Response>;
  setAccountDisplayName(
    displayName: string,
    errFn?: ErrorCallback
  ): Promise<void>;
  setAccountStatus(status: string, errFn?: ErrorCallback): Promise<void>;
  getAvatarChangeUrl(): Promise<string | undefined>;
}
