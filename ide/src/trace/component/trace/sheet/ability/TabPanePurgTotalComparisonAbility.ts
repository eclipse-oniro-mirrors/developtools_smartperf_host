/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this data except in compliance with the License.
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
import { type LitSelect } from '../../../../../base-ui/select/LitSelect';
import { LitSelectOption } from '../../../../../base-ui/select/LitSelectOption';
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { CompareStruct, compare, resizeObserverFromMemory } from '../SheetUtils';
import { type TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import { querySysPurgeableSelectionTab } from '../../../../database/sql/Ability.sql';

@element('tabpane-purgeable-total-comparison-ability')
export class TabPanePurgTotalComparisonAbility extends BaseElement {
  private purgeableTotalTable: LitTable | null | undefined;
  private purgeableTotalSource: Array<unknown> = [];
  private filterEl: TabPaneJsMemoryFilter | undefined | null;
  private selectEl: LitSelect | undefined | null;

  public initElements(): void {
    this.purgeableTotalTable = this.shadowRoot?.querySelector<LitTable>('#tb-purgeable-total');
    this.filterEl = this.shadowRoot!.querySelector<TabPaneJsMemoryFilter>('#filter');
    this.selectEl = this.filterEl?.shadowRoot?.querySelector<LitSelect>('lit-select');
  }

  public totalData(purgeTotalComParam: SelectionParam | unknown, dataList: unknown): void {
    if (this.purgeableTotalTable) {
      //@ts-ignore
      this.purgeableTotalTable.shadowRoot?.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45
        }px`;
    }
    this.purgeableTotalSource = [];
    let fileArr: unknown[] = []; // @ts-ignore
    for (let file of dataList) {
      // @ts-ignore
      if (file.startNs !== purgeTotalComParam.startNs) {
        fileArr.push(file);
      }
    }
    fileArr = fileArr.sort(); // @ts-ignore
    this.initSelect(purgeTotalComParam.startNs, fileArr); // @ts-ignore
    this.updateComparisonData(purgeTotalComParam.startNs, fileArr[0].startNs);
  }

  private initSelect(fileStartNs: number, purgeTotalComFileArr: Array<unknown>): void {
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.appendChild(option); // @ts-ignore
    if (purgeTotalComFileArr[0].name) {
      // @ts-ignore
      option.setAttribute('value', purgeTotalComFileArr[0].name);
    } // @ts-ignore
    this.selectEl!.defaultValue = purgeTotalComFileArr[0].name; // @ts-ignore
    this.selectEl!.placeholder = purgeTotalComFileArr[0].name;
    this.selectEl!.dataSource = purgeTotalComFileArr;
    let selectOption = this.selectEl!.querySelectorAll('lit-select-option');
    for (const item of selectOption) {
      item.addEventListener('onSelected', (e: unknown): void => {
        for (let f of purgeTotalComFileArr) {
          // @ts-ignore
          if (input.value === f.name) {
            // @ts-ignore
            this.updateComparisonData(fileStartNs, f.startNs);
          }
        } // @ts-ignore
        e.stopPropagation();
      });
    }
  }

  private async updateComparisonData(baseTime: number, targetTime: number): Promise<void> {
    this.purgeableTotalSource = [];
    let tableData = await this.queryTableData(baseTime, targetTime);
    this.purgeableTotalSource.push(tableData);
    if (this.purgeableTotalSource.length > 0) {
      this.purgeableTotalTable!.recycleDataSource = this.purgeableTotalSource;
    } else {
      this.purgeableTotalTable!.recycleDataSource = [];
    }
  }

  private async queryTableData(baseTime: number, targetTime: number): Promise<unknown> {
    let delta = {
      purgActiveDelta: '0Bytes',
      purgInActiveDelta: '0Bytes',
      shmPurgTotalDelta: '0Bytes',
    };
    const baseArr: CompareStruct[] = [];
    const targetArr: CompareStruct[] = [];
    // 点击的
    await querySysPurgeableSelectionTab(baseTime).then(async (results): Promise<void> => {
      for (let i = 0; i < results.length; i++) {
        //@ts-ignore
        baseArr.push(new CompareStruct(results[i].name, results[i].value));
      }
      // 被比较的
      await querySysPurgeableSelectionTab(targetTime).then((results): void => {
        for (let i = 0; i < results.length; i++) {
          //@ts-ignore
          targetArr.push(new CompareStruct(results[i].name, results[i].value));
        }
        let compareData = compare(baseArr, targetArr);
        for (let data of compareData) {
          if (data.key === 'ActivePurg') {
            delta.purgActiveDelta = Utils.getBinaryByteWithUnit(data.value);
          } else if (data.key === 'InActivePurg') {
            delta.purgInActiveDelta = Utils.getBinaryByteWithUnit(data.value);
          } else if (data.key === 'ShmPurg') {
            delta.shmPurgTotalDelta = Utils.getBinaryByteWithUnit(data.value);
          }
        }
      });
    });
    return delta;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    resizeObserverFromMemory(this.parentElement!, this.purgeableTotalTable!, this.filterEl!);
  }

  public initHtml(): string {
    return `
    <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
    </style>
    <lit-table id="tb-purgeable-total" style="height: auto">
        <lit-table-column width="1fr" title="PurgActiveDelta" data-index="purgActiveDelta" align="flex-start">
        </lit-table-column>
        <lit-table-column width="1fr" title="PurgInActiveDelta" data-index="purgInActiveDelta" align="flex-start">
        </lit-table-column>
        <lit-table-column width="1fr" title="ShmPurgTotalDelta" data-index="shmPurgTotalDelta"  align="flex-start">
        </lit-table-column>
    </lit-table>
    <lit-progress-bar class="progress"></lit-progress-bar>
    <tab-pane-js-memory-filter id="filter" first></tab-pane-js-memory-filter>
    `;
  }
}
