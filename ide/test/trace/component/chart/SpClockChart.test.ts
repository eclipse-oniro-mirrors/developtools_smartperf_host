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

import { SpClockChart } from '../../../../src/trace/component/chart/SpClockChart';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

const clockSqlite = require('../../../../src/trace/database/sql/Clock.sql');
jest.mock('../../../../src/trace/database/sql/Clock.sql');
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlLite = require('../../../../src/trace/database/sql/dmaFence.sql');
jest.mock('../../../../src/trace/database/sql/dmaFence.sql');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
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

describe('SpClockChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let clockChart = new SpClockChart(htmlElement);
  let queryClock = clockSqlite.queryClockData;
  let queryClockData = [
    {
      name: 'Frequency',
      num: 20,
      srcname: 'Frequency',
    },
    {
      name: 'State',
      num: 10,
      srcname: 'State',
    },
    {
      name: 'ScreenState',
      num: 10,
      srcname: 'ScreenState',
    },
  ];
  queryClock.mockResolvedValue(queryClockData);
  let queryDmaFenceName = sqlLite.queryDmaFenceName;
  let queryDmaFenceNameData = [
    {
      timeline: 'timeline1',
    },
    {
      timeline: 'timeline2',
    },
    {
      timeline: 'timeline3',
    },
  ];
  queryDmaFenceName.mockResolvedValue(queryDmaFenceNameData);
  it('SpClockChart01', function () {
    expect(clockChart.init()).toBeDefined();
  });
  it('SpClockChart02', function () {
    let traceRow = new TraceRow();
    expect(clockChart.initDmaFence(traceRow)).toBeDefined();
  });
});
