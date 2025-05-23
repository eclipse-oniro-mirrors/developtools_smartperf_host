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
import {
  HiPerfCpuStruct,
  HiperfCpuRender2,
} from '../../../../src/trace/database/ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';
import { hiPerf } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerHiPerfCPU Test', () => {
  let frame = {
    x: 0,
    y: 9,
    width: 10,
    height: 10,
  };
  it('ProcedureWorkerHiPerfCPUTest01', () => {
    const data = {
      frame: undefined,
      cpu: 3,
      startNs: 56,
      value: 45,
    };
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 4;
    const ctx = canvas.getContext('2d');
    expect(HiPerfCpuStruct.draw(ctx, '', data, true)).toBeUndefined();
  });

  it('ProcedureWorkerHiPerfCPUTest04', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    expect(HiPerfCpuStruct.drawRoundRectPath(ctx, 1, 1, 1, 1, 1)).toBeUndefined();
  });

  it('ProcedureWorkerHiPerfCPUTest05', function () {
    expect(HiPerfCpuStruct.groupBy10MS([{ id: 1, NS: 3 }, { copy: '1' }], 10, '')).toEqual([
      { dur: 10000000, height: NaN, eventCount: undefined ,startNS: NaN ,sampleCount: undefined },
      { dur: 10000000, height: NaN, eventCount: NaN ,startNS: NaN ,sampleCount: 2 }
    ]);
  });
  it('ProcedureWorkerHiPerfCPUTest06', function () {
    let req = {
      lazyRefresh: true,
      type: 'a',
      startNS: 1,
      endNS: 1,
      totalNS: 1,
      frame: {
        x: 20,
        y: 20,
        width: 100,
        height: 300,
      },
      useCache: false,
      range: {
        refresh: '',
      },
      canvas: 'a',
      context: {
        font: '11px sans-serif',
        fillStyle: '#ec407a',
        globalAlpha: 0.7,
        fill: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        beginPath: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => true),
        measureText: jest.fn(() => true),
        fillRect: jest.fn(() => true),
      },
      lineColor: '',
      isHover: '',
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      width: 100,
      flagSelectedInfo: '',
      slicesTime: 3,
      id: 1,
      x: 20,
      y: 20,
      height: 100,
      scale: 100_000_001,
      hoverX: 1,
    };
    let hiperfCpuRender = new HiperfCpuRender2();
    window.postMessage = jest.fn(() => true);
    expect(hiperfCpuRender.render(req, [], [], [])).toBeUndefined();
  });
  it('ProcedureWorkerHiPerfCPUTest08', function () {
    let dataList = new Array();
    dataList.push({
      startNS: 0,
      length: 1,
      frame: { x: 0, y: 9, width: 10, height: 10 },
      dur: 10,
    });
    dataList.push({ startNS: 1, dur: 2, length: 1 });
    hiPerf(dataList, [{ length: 0 }], dataList, 8, 3, '', true, 1, true);
  });
  it('ProcedureWorkerHiPerfCPUTest09 ', function () {
    let req = {
      lazyRefresh: true,
      type: 'a',
      startNS: 1,
      endNS: 1,
      totalNS: 1,
      frame: {
        x: 20,
        y: 20,
        width: 100,
        height: 300,
      },
      useCache: false,
      range: {
        refresh: '',
      },
      canvas: 'a',
      context: {
        font: '11px sans-serif',
        fillStyle: '#ec407a',
        globalAlpha: 0.7,
        fill: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        beginPath: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => true),
        measureText: jest.fn(() => true),
        fillRect: jest.fn(() => true),
      },
      lineColor: '',
      isHover: '',
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      width: 100,
      flagSelectedInfo: '',
      slicesTime: 3,
      id: 1,
      x: 20,
      y: 20,
      height: 100,
      scale: 100_000_001,
      hoverX: 1,
    };
    let hiperfCpuRender = new HiperfCpuRender2();
    window.postMessage = jest.fn(() => true);
    expect(hiperfCpuRender.renderMainThread(req,new TraceRow<HiPerfCpuStruct>()))
  });
});
