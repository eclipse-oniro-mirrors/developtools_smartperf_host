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
import {
  HiPerfEventStruct,
  HiperfEventRender,
} from '../../../../src/trace/database/ui-worker/hiperf/ProcedureWorkerHiPerfEvent';
import { hiPerf } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {
    TraceRow: () => {},
  };
});

describe('ProcedureWorkerHiPerfEvent Test', () => {
  it('ProcedureWorkerHiPerfEventTest03', () => {
    const data = {
      frame: {
        x: 50,
        y: 21,
        width: 60,
        height: 16,
      },
      cpu: 3,
      startNs: 41,
      value: 14,
    };
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    expect(HiPerfEventStruct.drawRoundRectPath(ctx, 1, 0, 10, 10, 12)).toBeUndefined();
  });

  it('ProcedureWorkerHiPerfEventTest04', function () {
    let node = {
      frame: {
        x: 22,
        y: 30,
        width: 90,
        height: 80,
      },
      startNS: 3,
      value: 33,
      startTs: 35,
      dur: 35,
      height: 55,
    };
    let frame = {
      x: 37,
      y: 77,
      width: 460,
      height: 600,
    };
    expect(HiPerfEventStruct.setFrame(node, 2, 1, 2, frame)).toBeUndefined();
  });

  it('ProcedureWorkerHiPerfEventTest05', function () {
    let node = {
      frame: {
        x: 30,
        y: 30,
        width: 660,
        height: 660,
      },
      startNS: 20,
      value: 60,
      startTs: 3,
      dur: 61,
      height: 63,
    };
    let frame = {
      x: 10,
      y: 20,
      width: 166,
      height: 330,
    };
    expect(HiPerfEventStruct.setFrame(node, 2, 1, 2, frame)).toBeUndefined();
  });

  it('ProcedureWorkerHiPerfEventTest06', function () {
    expect(HiPerfEventStruct.eventGroupBy10MS([{ ps: 1 }, { coX: '1' }], 10, '')).toEqual([
      { dur: 10000000, height: NaN, startNS: NaN, max: 0, sum: NaN },
    ]);
  });
  it('ProcedureWorkerHiPerfProcessTest08', function () {
    let hiperfEventRender = new HiperfEventRender();
    let req = {
      lazyRefresh: true,
      type: '',
      startNS: 1,
      endNS: 1,
      totalNS: 1,
      frame: {
        x: 234,
        y: 120,
        width: 100,
        height: 100,
      },
      useCache: false,
      range: {
        refresh: '',
      },
      canvas: 'event',
      context: {
        font: '11px sans-serif',
        fillStyle: '#ec407a',
        globalAlpha: 0.6,
        clearRect: jest.fn(() => true),
        measureText: jest.fn(() => true),
        fillRect: jest.fn(() => true),
        fillText: jest.fn(() => true),
        fill: jest.fn(() => true),
        beginPath: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => true),
      },
      isHover: '',
      hoverX: 1,
      id: 1,
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      flagSelectedInfo: '',
      slicesTime: 3,
      lineColor: '',
      x: 20,
      y: 20,
      width: 100,
      height: 100,
      scale: 100_000_001,
    };
    window.postMessage = jest.fn(() => true);
    expect(hiperfEventRender.render(req, [], [], [])).toBeUndefined();
  });
  it('ProcedureWorkerHiPerfEventTest09', function () {
    let dataList = new Array();
    dataList.push({
      length: 1,
      dur: 10,
      frame: { x: 0, y: 9, width: 10, height: 10 },
      startNS: 0,
    });
    dataList.push({ startNS: 1, dur: 2, length: 1 });
    hiPerf(dataList, [{ length: 0 }], dataList, 8, 3, '', false, 1, false);
  });
});
