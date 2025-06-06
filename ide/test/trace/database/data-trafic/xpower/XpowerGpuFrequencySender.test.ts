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

import { xpowerGpuFreqDataSender, xpowerGpuFreqCountDataSender } from '../../../../../src/trace/database/data-trafic/xpower/XpowerGpuFrequencySender';
import { threadPool } from '../../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerGpuFreqStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreq';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('xpowerGpuFreqDataSender Test', () => {
  let data = {
    filterId: 50,
    value: 50,
    startNS: 50,
    dur: 50,
  };
  it('xpowerGpuFreqDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, 1, true);
    });
    let traceRow = TraceRow.skeleton<XpowerGpuFreqStruct>();
    xpowerGpuFreqDataSender(traceRow).then((result) => {
      expect(result).toBeTruthy();
    });
  });

  it('xpowerGpuFreqDataSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, 1, true);
    });
    let traceRow = TraceRow.skeleton<XpowerGpuFreqStruct>();
    xpowerGpuFreqCountDataSender(traceRow).then((result) => {
      expect(result).toBeTruthy();
    });
  });
});
