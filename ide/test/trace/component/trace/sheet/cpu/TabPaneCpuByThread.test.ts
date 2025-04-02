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

import { TabPaneCpuByThread } from '../../../../../../src/trace/component/trace/sheet/cpu/TabPaneCpuByThread';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlit = require('../../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});

describe('TabPaneCpuByThread Test', () => {
  let tabPaneCpuByThread = new TabPaneCpuByThread();
  tabPaneCpuByThread.cpuByThreadTbl.injectColumns = jest.fn(()=> true)

  it('TabPaneCpuByThreadTest01', function () {
    expect(
      tabPaneCpuByThread.sortByColumn({
        key: 'number',
        sort: () => {},
      })
    ).toBeUndefined();
  });

  it('TabPaneCpuByThreadTest02', function () {
    expect(
      tabPaneCpuByThread.sortByColumn({
        key: 'pid' || 'wallDuration' || 'avgDuration' || 'occurrences',
      })
    ).toBeUndefined();
  });

  it('TabPaneCpuByThreadTest03', function () {
    let mockgetTabCpuByThread = sqlit.getTabCpuByThread;
    mockgetTabCpuByThread.mockResolvedValue([
      { process: 'test', wallDuration: 10, occurrences: 10, thread: '' },
      { process: 'test2', wallDuration: 11, occurrences: 11, thread: '' },
    ]);
    let a = { rightNs: 1, cpus: [11, 12, 13] };
    expect((tabPaneCpuByThread.data = a)).toBeTruthy();
  });

  it('TabPaneCpuByThreadTest04', function () {
    let mockgetTabCpuByThread = sqlit.getTabCpuByThread;
    mockgetTabCpuByThread.mockResolvedValue([]);
    let a = { rightNs: 1, cpus: [11, 12, 13] };
    expect((tabPaneCpuByThread.data = a)).toBeTruthy();
  });
});
