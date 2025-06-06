/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TraceSheet } from '../../../../../src/trace/component/trace/base/TraceSheet';
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TraceSheet Test', () => {
  global.Worker = jest.fn();
  let traceSheet = new TraceSheet();
  it('TraceSheet Test01', () => {
    expect(traceSheet).not.toBeUndefined();
  });

  it('TraceSheet Test08', () => {
    expect(traceSheet.connectedCallback()).toBeUndefined();
  });
  it('TraceSheet Test09', () => {
    expect(traceSheet.loadTabPaneData('key')).toBeUndefined();
  });

  it('TraceSheet Test10', () => {
    expect(traceSheet.updateRangeSelect()).toBeFalsy();
  });
});