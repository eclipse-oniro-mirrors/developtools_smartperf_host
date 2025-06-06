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

import { LitTable } from '../../../../../../src/base-ui/table/lit-table';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import {
  HanldParalLogic,
  MeterHeaderClick,
} from '../../../../../../src/trace/component/trace/sheet/parallel/ParallelUtil';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest
  .spyOn(require('../../../../../../src/trace/component/trace/sheet/parallel/ParallelUtil'), 'MeterHeaderClick')
  .mockReturnValue(1);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const intersectionObserverMock = () => ({
  observe: () => null,
});
describe('TabPaneMtParallel Test', () => {
  it('TabPaneMtParallelt01', function () {
    let value = {
      stateItem: 5,
    };
    expect(HanldParalLogic((dumpObj: unknown, value?: unknown, param?: unknown) => {}, value, {})).not.toBeUndefined();
  });

  it('TabPaneMtParallelt02', function () {
    let tab = new LitTable();
    expect(MeterHeaderClick(tab, [])).not.toBeUndefined();
  });
});
