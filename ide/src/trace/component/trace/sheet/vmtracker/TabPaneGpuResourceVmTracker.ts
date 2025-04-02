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
import { getByteWithUnit } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { resizeObserver } from '../SheetUtils';
import { queryGpuResourceTabData } from '../../../../database/sql/Gpu.sql';
@element('tabpane-gpu-resource')
export class TabPaneGpuResourceVmTracker extends BaseElement {
  private gpuResourceTable: LitTable | undefined | null;
  private gpuResourceDataSource: Array<unknown> = [];

  set data(startNs: number) {
    this.gpuResourceDataSource = [];
    this.setGpuResourceTableData(startNs);
  }

  private async setGpuResourceTableData(startNs: number): Promise<void> {
    await queryGpuResourceTabData(startNs).then((results) => {
      if (results.length > 0) {
        results.sort(function (a, b) {
          return b.totalSize - a.totalSize;
        });
        let totalSize = 0;
        for (let i = 0; i < results.length; i++) {
          this.gpuResourceDataSource.push({
            name: SpSystemTrace.DATA_DICT.get(results[i].channelId),
            size: getByteWithUnit(results[i].totalSize || 0),
          });
          totalSize += results[i].totalSize;
        }
        this.gpuResourceDataSource.unshift(
          { name: 'TimeStamp', size: ns2s(startNs) },
          // @ts-ignore
          { name: 'TimeStamp(Absolute)', size: (startNs + (window as unknown).recordStartNS) / 1000000000 },
          { name: 'Total', size: getByteWithUnit(totalSize) }
        );
      }
      this.gpuResourceTable!.recycleDataSource = this.gpuResourceDataSource;
    });
  }

  public initElements(): void {
    this.gpuResourceTable = this.shadowRoot?.querySelector<LitTable>('#gpu-resource-tbl');
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.gpuResourceTable!);
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        this.gpuResourceTable!.shadowRoot!.querySelector<HTMLDivElement>('.table')!.style.height = '100%';
        this.gpuResourceTable!.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }
  public initHtml(): string {
    return `<style>
            :host{
                display: flex;
                padding: 10px 10px;
                flex-direction: column;
                height: calc(100% - 20px);
            }
            #gpu-resource-tbl{
                height: 100%;
            }
        </style>
        <lit-table id="gpu-resource-tbl" no-head>
            <lit-table-column title="Name" data-index="name" align="flex-start" width="27%">
                <template><div>{{name}}</div></template>
            </lit-table-column>
            <lit-table-column title="size" data-index="size" align="flex-start" width="1fr">
                <template><div style="display: flex;">{{size}}</div></template>
            </lit-table-column>
        </lit-table>
        `;
  }
}
