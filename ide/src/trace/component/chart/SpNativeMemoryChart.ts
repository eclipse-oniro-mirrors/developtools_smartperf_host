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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { info } from '../../../log/Log';
import { procedurePool } from '../../database/Procedure';
import { type NativeEventHeap } from '../../bean/NativeHook';
import { HeapRender, HeapStruct } from '../../database/ui-worker/ProcedureWorkerHeap';
import { Utils } from '../trace/base/Utils';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { type BaseStruct } from '../../bean/BaseStruct';
import {
  nativeMemoryChartDataCacheSender,
  nativeMemoryChartDataSender,
} from '../../database/data-trafic/NativeMemoryDataSender';
import {queryNativeHookProcess, queryNativeHookStatisticsCount} from "../../database/sql/NativeHook.sql";
import {queryHeapGroupByEvent} from "../../database/sql/SqlLite.sql";
import {queryNativeMemoryRealTime} from "../../database/sql/Memory.sql";
import {queryBootTime} from "../../database/sql/Clock.sql";

export class SpNativeMemoryChart {
  static EVENT_HEAP: Array<NativeEventHeap> = [];
  static REAL_TIME_DIF: number = 0;
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  folderThreadHandler(row: TraceRow<BaseStruct>): void {
    row.onThreadHandler = (useCache): void => {
      row.canvasSave(this.trace.canvasPanelCtx!);
      if (row.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
      } else {
        (renders.empty as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          row
        );
      }
      row.canvasRestore(this.trace.canvasPanelCtx!, this.trace);
    };
  }

  chartThreadHandler(row: TraceRow<HeapStruct>): void {
    row.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (row.currentContext) {
        context = row.currentContext;
      } else {
        context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      row.canvasSave(context);
      (renders.heap as HeapRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'heap',
        },
        row
      );
      row.canvasRestore(context, this.trace);
    };
  }

  initNativeMemoryFolder(process: number, ipid: number): TraceRow<BaseStruct> {
    const nativeRow = TraceRow.skeleton();
    nativeRow.rowId = `native-memory ${process} ${ipid}`;
    nativeRow.index = 0;
    nativeRow.rowType = TraceRow.ROW_TYPE_NATIVE_MEMORY;
    nativeRow.drawType = 0;
    nativeRow.style.height = '40px';
    nativeRow.rowParentId = '';
    nativeRow.folder = true;
    nativeRow.addTemplateTypes('NativeMemory', 'Memory');
    nativeRow.name = `Native Memory (${process})`;
    nativeRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    nativeRow.selectChangeHandler = this.trace.selectChangeHandler;
    nativeRow.addRowSettingPop();
    nativeRow.rowSetting = 'enable';
    nativeRow.rowSettingPopoverDirection = 'bottomLeft';
    nativeRow.rowSettingList = [
      {
        key: '0',
        title: 'Current Bytes',
        checked: true,
      },
      {
        key: '1',
        title: 'Native Memory Density',
      },
    ];
    nativeRow.onRowSettingChangeHandler = (value): void => {
      nativeRow.childrenList.forEach((row) => (row.drawType = parseInt(value[0])));
      this.trace
        .getCollectRows((row) => row.rowType === 'heap')
        .forEach((it) => {
          it.drawType = parseInt(value[0]);
        });
      this.trace.refreshCanvas(false);
    };
    nativeRow.supplier = (): Promise<BaseStruct[]> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    this.folderThreadHandler(nativeRow);
    this.trace.rowsEL?.appendChild(nativeRow);
    return nativeRow;
  }

  initAllocMapChart(folder: TraceRow<BaseStruct>, type: string, process: { pid: number; ipid: number }): void {
    const chartList = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'];
    for (let i = 0; i < chartList.length; i++) {
      const nm = chartList[i];
      const allHeapRow = TraceRow.skeleton<HeapStruct>();
      allHeapRow.index = i;
      allHeapRow.rowParentId = `native-memory ${process.pid} ${process.ipid}`;
      allHeapRow.rowHidden = !folder.expansion;
      allHeapRow.style.height = '40px';
      allHeapRow.name = nm;
      allHeapRow.rowId = nm;
      allHeapRow.drawType = 0;
      allHeapRow.isHover = true;
      allHeapRow.folder = false;
      allHeapRow.rowType = TraceRow.ROW_TYPE_HEAP;
      allHeapRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      allHeapRow.selectChangeHandler = this.trace.selectChangeHandler;
      allHeapRow.setAttribute('heap-type', type);
      allHeapRow.setAttribute('children', '');
      allHeapRow.focusHandler = (): void => {
        let tip = '';
        if (HeapStruct.hoverHeapStruct) {
          if (allHeapRow.drawType === 1) {
            tip = `<span>${HeapStruct.hoverHeapStruct.density}</span>`;
          } else {
            tip = `<span>${Utils.getByteWithUnit(HeapStruct.hoverHeapStruct.heapsize!)}</span>`;
          }
        }
        this.trace?.displayTip(allHeapRow, HeapStruct.hoverHeapStruct, tip);
      };
      allHeapRow.findHoverStruct = (): void => {
        HeapStruct.hoverHeapStruct = allHeapRow.getHoverStruct();
      };
      allHeapRow.supplierFrame = (): Promise<any> =>
        nativeMemoryChartDataSender(allHeapRow, {
          eventType: i,
          ipid: process.ipid,
          model: type,
          drawType: allHeapRow.drawType,
        });
      this.chartThreadHandler(allHeapRow);
      folder.addChildTraceRow(allHeapRow);
    }
  }

  initChart = async (): Promise<void> => {
    let time = new Date().getTime();
    let nativeMemoryType = 'native_hook';
    let nmsCount = await queryNativeHookStatisticsCount();
    if (nmsCount && nmsCount[0] && nmsCount[0].num > 0) {
      nativeMemoryType = 'native_hook_statistic';
    }
    let nativeProcess = await queryNativeHookProcess(nativeMemoryType);
    info('NativeHook Process data size is: ', nativeProcess!.length);
    if (nativeProcess.length === 0) {
      return;
    }
    await this.initNativeMemory();
    await nativeMemoryChartDataCacheSender(
      nativeProcess.map((it) => it.ipid),
      nativeMemoryType
    );
    SpNativeMemoryChart.EVENT_HEAP = await queryHeapGroupByEvent(nativeMemoryType);
    for (const process of nativeProcess) {
      const nativeRow = this.initNativeMemoryFolder(process.pid, process.ipid);
      this.initAllocMapChart(nativeRow, nativeMemoryType, process);
    }
    let durTime = new Date().getTime() - time;
    info('The time to load the Native Memory data is: ', durTime);
  };

  initNativeMemory = async (): Promise<void> => {
    let time = new Date().getTime();
    let isRealtime = false;
    let realTimeDif = 0;
    SpNativeMemoryChart.REAL_TIME_DIF = 0;
    let queryTime = await queryNativeMemoryRealTime();
    let bootTime = await queryBootTime();
    if (queryTime.length > 0) {
      isRealtime = queryTime[0].clock_name === 'realtime';
    }
    if (bootTime.length > 0 && isRealtime) {
      realTimeDif = queryTime[0].ts - bootTime[0].ts;
      SpNativeMemoryChart.REAL_TIME_DIF = realTimeDif;
    }
    await new Promise<any>((resolve) => {
      procedurePool.submitWithName(
        'logic0',
        'native-memory-init',
        { isRealtime, realTimeDif },
        undefined,
        (res: any) => {
          resolve(res);
        }
      );
    });
    let durTime = new Date().getTime() - time;
    info('The time to init the native memory data is: ', durTime);
  };
}
