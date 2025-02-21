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

import { TabPaneThreadUsage } from '../../../../../../src/trace/component/trace/sheet/process/TabPaneThreadUsage';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlit = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {
    CpuStruct: {
      cpuCount: 0,
    },
  };
});

describe('TabPaneThreadUsage Test', () => {
  let threadUsage = new TabPaneThreadUsage();
  sqlit.getTabThreadStatesCpu.mockResolvedValue([
    {
      pid: 28549,
      tid: 28549,
      cpu: 0,
      wallDuration: 6447000,
    },
    {
      pid: 28549,
      tid: 28549,
      cpu: 1,
      wallDuration: 4402000,
    },
    {
      pid: 28549,
      tid: 28549,
      cpu: 3,
      wallDuration: 41852000,
    },
  ]);

  let tabRunningPersent = sqlit.getTabRunningPersent;
  tabRunningPersent.mockResolvedValue([
    {
      pid: 1,
      tid: 25,
      state:"",
      cpu: 1,
      dur: 5825,
      ts: 2556
    }
  ]);

  it('TabPaneThreadUsageTest01', function () {
    let a = {
      recordStartNs: 26014913992000,
      leftNs: 341320659,
      rightNs: 7402391794,
      hasFps: false,
      perfAll: false,
      fileSysVirtualMemory: false,
      diskIOLatency: false,
      fsCount: 0,
      vmCount: 0,
      isCurrentPane: false,
      startup: false,
      staticInit: false,
      cpus: [],
      cpuStateFilterIds: [],
      cpuFreqFilterIds: [],
      cpuFreqLimitDatas: [],
      threadIds: [28549],
      processIds: [28549],
      processTrackIds: [],
    };
    expect((threadUsage.data = a)).toBeTruthy();
  });

  it('TabPaneThreadUsageTest02', function () {
    expect(
      threadUsage.sortByColumn({
        key: 'name' || 'thread' || 'state',
        sort: () => {},
      })
    ).toBeUndefined();
  });
});
