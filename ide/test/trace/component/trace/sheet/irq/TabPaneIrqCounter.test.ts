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

import { TabPaneIrqCounter } from '../../../../../../src/trace/component/trace/sheet/irq/TabPaneIrqCounter';
import { IrqStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerIrq';
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
const sqlite = require('../../../../../../src/trace/database/sql/Irq.sql');
jest.mock('../../../../../../src/trace/database/sql/Irq.sql');

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneIrqCounter Test', () => {
  document.body.innerHTML = `<div><tabpane-irq-counter id="irq"></tabpane-irq-counter></div>`;
  let tabPaneIrqCounter = document.querySelector<TabPaneIrqCounter>('#irq');
  let map = new Map();
  map.set('irq', [new IrqStruct()]);
  let frameData = {
    leftNs: 253,
    rightNs: 1252,
    argSetId: 5,
    startNS: 11111,
    dur: 22222,
    name: 'irq',
    irqMapData: map,
    framesData: [
      {
        id: 25,
        ts: 254151,
        dur: 1202,
        name: '1583',
        argSetId: 5,
        type: '0',
        pid: 20,
        gpu_dur: 2568,
        app_dur: 110,
      },
    ],
  };

  let irqData = sqlite.queryIrqDataBoxSelect;
  irqData.mockResolvedValue([
    {
      irqName: "name",
      wallDuration: 9536,
      maxDuration: 5239,
      count: 1,
      avgDuration: 2563
    }
  ]);

  let softIrqData = sqlite.querySoftIrqDataBoxSelect;
  softIrqData.mockResolvedValue([
    {
      irqName: "name",
      wallDuration: 6765,
      maxDuration: 56756,
      count: 1,
      avgDuration: 46545
    }
  ]);

  it('TabPaneIrqCounterTest01', function () {
    tabPaneIrqCounter.data = frameData;
    expect(tabPaneIrqCounter.data).not.toBeUndefined();
  });
});
