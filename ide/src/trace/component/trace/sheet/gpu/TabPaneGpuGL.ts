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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { log } from '../../../../../log/Log';
import { getProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { resizeObserver } from '../SheetUtils';
import { Utils } from '../../base/Utils';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { queryGpuDataTab } from '../../../../database/sql/Gpu.sql';

interface GL {
  startTs: number;
  startTsStr?: string;
  size: number;
  sizeStr?: string;
}

@element('tabpane-gpu-gl')
export class TabPaneGpuGL extends BaseElement {
  private glTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private glSource: Array<GL> = [];
  private currentSelectionParam: SelectionParam | undefined;

  set data(glParam: SelectionParam | unknown) {
    if (this.currentSelectionParam === glParam) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = glParam;
    //@ts-ignore
    this.glTbl?.shadowRoot?.querySelector('.table')?.style?.height = this.parentElement!.clientHeight - 45 + 'px';
    // @ts-ignore
    this.range!.textContent = 'Selected range: ' + ((glParam.rightNs - glParam.leftNs) / 1000000.0).toFixed(5) + ' ms';
    this.glTbl!.loading = true;
    queryGpuDataTab(
      MemoryConfig.getInstance().iPid,
      // @ts-ignore
      glParam.leftNs,
      // @ts-ignore
      glParam.rightNs,
      MemoryConfig.getInstance().snapshotDur,
      "'mem.gl_pss'"
    ).then((result) => {
      this.glTbl!.loading = false;
      log('queryGpuDataTab result size : ' + result.length);
      if (result.length > 0) {
        result.forEach((it: GL) => {
          it.startTsStr = getProbablyTime(it.startTs);
          it.sizeStr = Utils.getBinaryByteWithUnit(it.size);
        });
        this.glSource = result;
        this.glTbl!.recycleDataSource = this.glSource;
      } else {
        this.glSource = [];
        this.glTbl!.recycleDataSource = [];
      }
    });
  }

  initElements(): void {
    this.glTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gl');
    this.range = this.shadowRoot?.querySelector('#gl-time-range');
    this.glTbl!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.glTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .gl-table{
          flex-direction: row;
          margin-bottom: 5px;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <div class="gl-table" style="display: flex;height: 20px;align-items: center;flex-direction: row;margin-bottom: 5px">
            <div style="flex: 1"></div>
            <label id="gl-time-range"  style="width: auto;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        </div>
        <div style="overflow: auto">
            <lit-table id="tb-gl" style="height: auto">
                <lit-table-column width="600px" title="Timestamp"  data-index="startTsStr" key="startTsStr"  align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="200px" title="GL_PSS" data-index="sizeStr" key="sizeStr"  align="flex-start" order>
                </lit-table-column>
            </lit-table>
        </div>
        `;
  }
  sortByColumn(detail: { key: string; sort: number }): void {
    this.glSource.sort((gpuA, gpuB) => {
      if (detail.sort === 0) {
        return gpuA.startTs - gpuB.startTs;
      } else {
        let key = detail.key.replace('Str', '');
        // @ts-ignore
        let valueA = (gpuA as unknown)[key];
        // @ts-ignore
        let valueB = (gpuB as unknown)[key];
        return detail.sort === 1 ? valueA - valueB : valueB - valueA;
      }
    });
    this.glTbl!.recycleDataSource = this.glSource;
  }
}
