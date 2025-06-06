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
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { FpsRender, FpsStruct } from '../../database/ui-worker/ProcedureWorkerFPS';
import { getFps } from '../../database/sql/SqlLite.sql';

export class SpFpsChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let res = await getFps();
    if (res.length === 0) {
      return;
    }
    let startTime = new Date().getTime();
    let fpsRow = TraceRow.skeleton<FpsStruct>();
    fpsRow.rowId = 'fps';
    fpsRow.rowType = TraceRow.ROW_TYPE_FPS;
    fpsRow.rowParentId = '';
    FpsStruct.maxFps = 0;
    fpsRow.style.height = '40px';
    fpsRow.name = 'FPS'; //@ts-ignore
    fpsRow.supplier = (): Promise<Array<unknown>> => new Promise<Array<unknown>>((resolve, reject) => resolve(res));
    fpsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    fpsRow.selectChangeHandler = this.trace.selectChangeHandler;
    fpsRow.focusHandler = (ev): void => {
      let tip = '';
      if (FpsStruct.hoverFpsStruct) {
        tip = `<span>${FpsStruct.hoverFpsStruct.fps || 0}</span> `;
      }
      this.trace?.displayTip(fpsRow, FpsStruct.hoverFpsStruct, tip);
    };
    fpsRow.findHoverStruct = (): void => {
      FpsStruct.hoverFpsStruct = fpsRow.getHoverStruct();
    };
    fpsRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (fpsRow.currentContext) {
        context = fpsRow.currentContext;
      } else {
        context = fpsRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      fpsRow.canvasSave(context);
      (renders.fps as FpsRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'fps0',
        },
        fpsRow
      );
      fpsRow.canvasRestore(context, this.trace);
    };
    this.trace.rowsEL?.appendChild(fpsRow);
    let durTime = new Date().getTime() - startTime;
    info('The time to load the FPS data is: ', durTime);
  }
}
