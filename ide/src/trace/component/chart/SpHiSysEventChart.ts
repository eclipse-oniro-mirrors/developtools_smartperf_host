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
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { HiSysEventRender, HiSysEventStruct } from '../../database/ui-worker/ProcedureWorkerHiSysEvent';
import { hiSysEventDataSender } from '../../database/data-trafic/HiSysEventDataSender';
import { queryHiSysEventData } from '../../database/sql/Perf.sql';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

export class SpHiSysEventChart {
  private trace: SpSystemTrace;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    let hiSysEventData = await queryHiSysEventData();
    if (hiSysEventData.length === 0) {
      return;
    }
    let eventRow = await this.initRow();
    this.trace.rowsEL?.appendChild(eventRow);
  }

  async initRow(): Promise<TraceRow<HiSysEventStruct>> {
    let hiSysEventRow = TraceRow.skeleton<HiSysEventStruct>();
    hiSysEventRow.rowParentId = '';
    hiSysEventRow.rowId = 'Hisysevent';
    hiSysEventRow.rowType = TraceRow.ROW_TYPE_HI_SYSEVENT;
    hiSysEventRow.name = 'Hisysevent';
    hiSysEventRow.style.width = '100%';
    hiSysEventRow.style.height = '40px';
    hiSysEventRow.setAttribute('height', '40px');
    hiSysEventRow.setAttribute('children', '');
    hiSysEventRow.supplierFrame = (): Promise<HiSysEventStruct[]> => {
      return hiSysEventDataSender(hiSysEventRow).then((res) => {
        return res;
      });
    };
    hiSysEventRow.addTemplateTypes('HiSysEvent');
    hiSysEventRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    hiSysEventRow.selectChangeHandler = this.trace.selectChangeHandler;
    hiSysEventRow.onThreadHandler = (useCache: boolean): void => {
      let context: CanvasRenderingContext2D;
      if (hiSysEventRow.currentContext) {
        context = hiSysEventRow.currentContext;
      } else {
        context = hiSysEventRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      hiSysEventRow!.canvasSave(context);
      (renders.hiSysEvent as HiSysEventRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'hisys_event',
        },
        hiSysEventRow!
      );
      hiSysEventRow!.canvasRestore(context, this.trace);
    };
    return hiSysEventRow;
  }
}
