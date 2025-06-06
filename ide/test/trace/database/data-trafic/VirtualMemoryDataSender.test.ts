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

import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { virtualMemoryDataSender } from '../../../../src/trace/database/data-trafic/VirtualMemoryDataSender';
import { VirtualMemoryStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerVirtualMemory';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('VirtualMemoryDataSender Test', () => {
  let resultVm = {
    delta: 1,
    duration: 4830101562,
    filterID: 202,
    frame: {x: 190, y: 5, width: 62, height: 30},
    maxValue: 144753,
    startTime: 148505,
    value: 124362
  }
  it('VirtualMemorySenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(resultVm, 1, true);
    });
    let virtualMemoryTraceRow = TraceRow.skeleton<VirtualMemoryStruct>();
    virtualMemoryDataSender(6346, virtualMemoryTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });
});