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
import { TabPaneGpuMemoryVmTrackerComparison } from '../../../../../../src/trace/component/trace/sheet/vmtracker/TabPaneGpuMemoryVmTrackerComparison';
const sqlite = require('../../../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {},
    removeAttribute: () => {},
  };
});
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    unobserve: jest.fn(),
    observe: jest.fn(),
  }));

describe('TabPaneGpuMemoryVmTrackerComparison Test', () => {
  let tabPaneGpuMemoryVmTrackerComparison = new TabPaneGpuMemoryVmTrackerComparison();
  let getTabGpuMemoryVmTrackerComparisonData = sqlite.getTabGpuMemoryVmTrackerComparisonData;
  let gpuMemoryVmTrackerData = [
    {
      startNs: 0,
      value: 100,
    },
  ];
  let datalist = [
    {
      name: 'Snapshot2',
      startNs: 98012526561,
      type: 'VmTracker',
      value: 0,
    },
    {
      name: 'Snapshot1',
      startNs: 47735214061,
      type: 'VmTracker',
      value: 0,
    },
  ];
  tabPaneGpuMemoryVmTrackerComparison.init = jest.fn(() => true);
  getTabGpuMemoryVmTrackerComparisonData.mockResolvedValue(gpuMemoryVmTrackerData);
  it('TabPaneGpuMemoryVmTrackerComparison01', function () {
    expect(tabPaneGpuMemoryVmTrackerComparison.queryDataByDB(10)).toBeTruthy();
  });
  it('TabPaneGpuMemoryVmTrackerComparison02', function () {
    expect(tabPaneGpuMemoryVmTrackerComparison.sortGpuMemoryByColumn(0, '')).toBeUndefined();
  });
  it('TabPaneGpuMemoryVmTrackerComparison03', function () {
    expect(tabPaneGpuMemoryVmTrackerComparison.sortGpuMemoryByColumn(1, 'thread')).toBeUndefined();
  });
});
