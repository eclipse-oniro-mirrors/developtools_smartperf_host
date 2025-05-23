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
  drawFlagLine,
  drawLines,
  Point,
  Rect,
  ns2s,
  ns2x,
  drawSelection,
  drawWakeUp,
  fillCacheData,
  findRange,
  dataFilterHandler,
  drawLinkLines,
  drawWakeUpList,
  // @ts-ignore
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import { ColorUtils } from '../../../../src/trace/component/trace/base/ColorUtils';
import { EventCenter } from '../../../../src/trace/component/trace/base/EventCenter';
import { Flag } from '../../../../src/trace/component/trace/timer-shaft/Flag';

declare global {
  interface Window {
    SmartEvent: {
      UI: {
        RefreshCanvas: string; //selected menu trace
        SliceMark: string; //Set the tag scope
        TraceRowComplete: string; //Triggered after the row component has finished loading data
        MenuTrace: string; //selected menu trace
        TimeRange: string; //Set the timeline range
      };
    };

    subscribeOnce(evt: string, fn: (b: any) => void): void;

    clearTraceRowComplete(): void;

    unsubscribe(evt: string, fn: (b: any) => void): void;

    publish(evt: string, data: any): void;

    subscribe(evt: string, fn: (b: any) => void): void;
  }
}

window.SmartEvent = {
  UI: {
    MenuTrace: 'SmartEvent-UI-MenuTrace',
    RefreshCanvas: 'SmartEvent-UI-RefreshCanvas',
    SliceMark: 'SmartEvent-UI-SliceMark',
    TimeRange: 'SmartEvent-UI-TimeRange',
    TraceRowComplete: 'SmartEvent-UI-TraceRowComplete',
  },
};
Window.prototype.unsubscribe = (ev, fn) => EventCenter.unsubscribe(ev, fn);
Window.prototype.subscribe = (ev, fn) => EventCenter.subscribe(ev, fn);
Window.prototype.publish = (ev, data) => EventCenter.publish(ev, data);
Window.prototype.subscribeOnce = (ev, data) => EventCenter.subscribeOnce(ev, data);
Window.prototype.clearTraceRowComplete = () => EventCenter.clearTraceRowComplete();
jest.mock('../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  TraceRow:{
    range:{
      startNS: 64;
      endNS: 25453;
      totalNS: 333;
    }
    ;
  }
});
describe('ProcedureWorkerCommon Test', () => {
  let rect = new Rect();
  let fullData = [
    {
      cpu: 2,
      dur: 140000,
      end_state: 'S',
      frame: {
        y: 5,
        height: 30,
      },
      id: 62,
      name: '2555',
      priority: 100,
      processCmdLine: 'com.test',
      processId: 2983,
      processName: 'com.test',
      schedId: 44,
      startTime: 3845000,
      tid: 2996,
      type: 'thread',
    },
  ];
  let filterData = [
    {
      cpu: 0,
      dur: 69444,
      end_state: 'sR',
      frame: {y: 15, height: 10, x: 13, width: 34},
      id: 4,
      name: 'test',
      priority: 23,
      processCmdLine: 'test',
      processId: 3255,
      processName: 'test',
      schedId: 3,
      startTime: 53333,
      tid: 6,
      translateY: 0,
      type: 'thread',
      v: false,
    },
  ];
  let condition = {
    startKey: 'startNS',
    durKey: 'dur',
    startNS: 20,
    endNS: 1000,
    totalNS: 2000,
    frame: {x: 10, y: 10},
    paddingTop: 5,
    useCache: true,
  };

  let timerShaftElement = document.createElement('timer-shaft-element');
  timerShaftElement.getBoundingClientRect = jest.fn(() => {
    return {
      width: 648,
    };
  });

  it('ProcedureWorkerCommon01', function () {
    expect(rect.contains(1, 2)).not.toBeUndefined();
  });

  it('ProcedureWorkerCommon02', function () {
    expect(rect.containsWithPadding()).not.toBeUndefined();
  });

  it('ProcedureWorkerCommon03', function () {
    let point = new Point();
    expect(point).not.toBeUndefined();
  });

  it('ProcedureWorkerCommon04', function () {
    let rect = new Rect();
    expect(Rect.contains(rect, 1, 2)).toBe(false);
  });

  it('ProcedureWorkerCommon05', function () {
    let rect = new Rect();
    expect(Rect.containsWithPadding(rect, 1, 2, 1, 2)).toBe(false);
  });

  it('ProcedureWorkerCommon06', function () {
    let rect = new Rect();
    expect(Rect.containsWithMargin(rect, 1, 2, 1, 2, 1, 1)).toBe(false);
  });

  it('ProcedureWorkerCommon07', function () {
    let rect = new Rect();
    let rect2 = new Rect();
    expect(Rect.intersect(rect, rect2)).toBe(false);
  });

  it('ProcedureWorkerCommon08', function () {
    let rect = new Rect();
    expect(rect.containsWithMargin(1, 2, 3, 5, 4, 5)).toBe(false);
  });

  it('ProcedureWorkerCommon09', function () {
    let rect = new Rect();
    expect(rect.containsWithPadding(1, 2, 3, 5)).toBe(false);
  });

  it('ProcedureWorkerCommon10', function () {
    let rect = new Rect();
    let rect2 = new Rect();
    expect(rect.intersect(rect2)).toBe(false);
  });

  it('ProcedureWorkerCommon011', function () {
    expect(ColorUtils.formatNumberComma('11232')).toBe('11,232');
  });

  it('ProcedureWorkerCommon012', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    let aaa = [1, 2, 3];
    drawLines(ctx, aaa, 1, '#ffff');
    expect(ColorUtils.formatNumberComma('11232')).toBe('11,232');
  });

  it('ProcedureWorkerCommon013', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    let aaa = [1, 2, 3];
    let flag = new Flag(1, 2, 3, 4, 5, '#FFF', false);
    let rect2 = new Rect();
    drawFlagLine(ctx, aaa, flag, 1, 2, 2, rect2);
    expect(ColorUtils.formatNumberComma('11232')).toBe('11,232');
  });

  it('ProcedureWorkerCommon20', function () {
    expect(ns2s(2_000_000_000)).toBe('2.0 s');
  });

  it('ProcedureWorkerCommon21', function () {
    expect(ns2s(2_000_000)).toBe('2.0 ms');
  });

  it('ProcedureWorkerCommon22', function () {
    expect(ns2s(2_000)).toBe('2.0 μs');
  });

  it('ProcedureWorkerCommon23', function () {
    expect(ns2s(1)).toBe('1.0 ns');
  });

  it('ProcedureWorkerCommon25', function () {
    expect(ColorUtils.hashFunc('', 10, 10)).toBe(3);
  });

  it('ProcedureWorkerCommon26', function () {
    expect(ns2x(10, 1, 0, 1, {width: 2})).toBe(2);
  });

  it('ProcedureWorkerCommon27', function () {
    expect(ns2x(-10, 1, 0, 1, {width: 2})).toBe(0);
  });

  it('ProcedureWorkerCommon28', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    let flag = {
      color: '',
      x: 1,
    };
    let select = {
      color: '',
      x: 1,
      time: '',
    };
    let frame = {
      height: 1,
    };
    let slicesTime = {
      startTime: 1,
      endTime: 1,
      color: '#dadada',
    };
    expect(drawFlagLine(ctx, flag, select, 1, 2, 1, frame, slicesTime)).toBeUndefined();
  });

  it('ProcedureWorkerCommon29', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');

    let params = {
      isRangeSelect: true,
      rangeSelectObject: {
        startX: 31,
        endX: 13,
        startNS: 132,
        endNS: 120,
      },
      startNS: 21,
      endNS: 120,
      totalNS: 49,
      frame: {
        y: 1,
      },
    };
    expect(drawSelection(context, params)).toBeUndefined();
  });

  it('ProcedureWorkerCommon30', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    let wake = {
      wakeupTime: 12,
      cpu: 2,
    };
    let frame = new Rect(20, 30, 10, 30);
    let selectCpuStruct = [
      {
        cpu: 3,
        dur: 9031110,
        end_state: 'R',
        frame: {y: 0, height: 60, x: 31, width: 3},
        id: 9,
        name: 'test',
        priority: 120,
        processCmdLine: 'lin',
        processId: 3303,
        processName: 'test',
        schedId: 55,
        startTime: 4064044,
        tid: 3303,
        translateY: 40,
        type: 'thread',
        v: true,
      },
    ];
    expect(drawWakeUp(context, wake, 1, 2, 1, frame, selectCpuStruct, undefined)).toBeUndefined();
  });

  it('ProcedureWorkerCommon31', function () {
    let fillCache = fillCacheData(filterData, condition);
    expect(fillCache).toBe(true);
  });

  it('ProcedureWorkerCommon32', function () {
    let slice = findRange(fullData, condition);
    expect(slice.length).toBe(1);
  });

  it('ProcedureWorkerCommon33', function () {
    let condition = {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: 20,
      endNS: 1000,
      totalNS: 2000,
      frame: {x: 10, y: 10},
      paddingTop: 5,
      useCache: false,
    };
    let dataFilter = dataFilterHandler(fullData, filterData, condition);
    expect(dataFilter).toBeUndefined();
  });
  it('ProcedureWorkerCommon37', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    let tm = {
      getRange: jest.fn(() => true),
      getBoundingClientRect: jest.fn(() => true),
    };
    expect(drawLinkLines(context, [], tm, true)).toBeUndefined();
  });
  it('ProcedureWorkerCommon39', function () {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    let wake = {
      wakeupTime: 23,
    };
    let frame = new Rect(20, 30, 10, 30);
    expect(drawWakeUpList(context, wake, 0, 1000, 1000, frame, true, undefined, false)).toBeUndefined();
  });
});
