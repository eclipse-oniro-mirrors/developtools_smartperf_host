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
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { resizeObserver } from '../SheetUtils';

@element('tabpane-clock-counter')
export class TabPaneClockCounter extends BaseElement {
  private clockCounterTbl: LitTable | null | undefined;
  private clockCounterRange: HTMLLabelElement | null | undefined;
  private clockCounterSource: Array<SelectionData> = [];

  set data(clockCounterValue: SelectionParam) {
    //@ts-ignore
    this.clockCounterTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.clockCounterRange!.textContent = `Selected range: ${parseFloat(
      ((clockCounterValue.rightNs - clockCounterValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.getCounterData(clockCounterValue).then();
  }

  async getCounterData(clockCounterValue: SelectionParam): Promise<void> {
    let dataSource: Array<SelectionData> = [];
    let collect = clockCounterValue.clockMapData;
    let sumCount = 0;
    this.clockCounterTbl!.loading = true;
    for (let key of collect.keys()) {
      let counters = collect.get(key);
      let res = await counters?.({
        startNS: clockCounterValue.leftNs,
        endNS: clockCounterValue.rightNs,
        queryAll: true,
      });
      let sd = this.createSelectCounterData(key, res || [], clockCounterValue.leftNs, clockCounterValue.rightNs);
      sumCount += Number.parseInt(sd.count || '0');
      dataSource.push(sd);
    }
    let sumData = new SelectionData();
    sumData.count = sumCount.toString();
    sumData.process = ' ';
    dataSource.splice(0, 0, sumData);
    this.clockCounterTbl!.loading = false;
    this.clockCounterSource = dataSource;
    this.clockCounterTbl!.recycleDataSource = dataSource;
  }

  initElements(): void {
    this.clockCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.clockCounterRange = this.shadowRoot?.querySelector('#time-range');
    this.clockCounterTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.clockCounterTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .clock-counter-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="clock-counter-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <lit-table id="tb-counter" style="height: auto">
            <lit-table-column order title="Name" data-index="name" key="name"  align="flex-start" width="25%">
            </lit-table-column>
            <lit-table-column data-index="delta" order title="Delta value"  key="delta"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Rate /s" key="rate" order data-index="rate" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Weighted avg value" order data-index="avgWeight" key="avgWeight"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="count" title="Count" order key="count"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="First value" data-index="first" order key="first"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Last value" align="flex-start" order data-index="last" key="last" width="1fr">
            </lit-table-column>
            <lit-table-column title="Min value" key="min" data-index="min" order align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="max" title="Max value" key="max"  order align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  createSelectCounterData(name: string, list: Array<unknown>, leftNs: number, rightNs: number): SelectionData {
    let selectCounterData = new SelectionData();
    if (list.length > 0) {
      let range = rightNs - leftNs;
      let first = list[0];
      // @ts-ignore
      selectCounterData.trackId = first.filterId;
      selectCounterData.name = name;
      // @ts-ignore
      selectCounterData.first = `${first.value}`;
      selectCounterData.count = `${list.length}`;
      // @ts-ignore
      selectCounterData.last = `${list[list.length - 1].value}`;
      selectCounterData.delta = `${parseInt(selectCounterData.last) - parseInt(selectCounterData.first)}`;
      selectCounterData.rate = (parseInt(selectCounterData.delta) / ((range * 1.0) / 1000000000)).toFixed(4);
      // @ts-ignore
      selectCounterData.min = `${first.value}`;
      selectCounterData.max = '0';
      let weightAvg = 0.0;
      for (let i = 0; i < list.length; i++) {
        let counter = list[i];
        // @ts-ignore
        if (counter.value < parseInt(selectCounterData.min)) {
          // @ts-ignore
          selectCounterData.min = counter.value.toString();
        }
        // @ts-ignore
        if (counter.value > parseInt(selectCounterData.max)) {
          // @ts-ignore
          selectCounterData.max = counter.value.toString();
        }
        // @ts-ignore
        let start = i === 0 ? leftNs : counter.startNS;
        // @ts-ignore
        let end = i === list.length - 1 ? rightNs : list[i + 1].startNS;
        // @ts-ignore
        weightAvg += counter.value * (((end - start) * 1.0) / range);
      }
      selectCounterData.avgWeight = weightAvg.toFixed(2);
    }
    return selectCounterData;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (clockCounterLeftData: SelectionData, clockCounterRightData: SelectionData): number {
        if (clockCounterLeftData.process === ' ' || clockCounterRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(clockCounterRightData[property]) - parseFloat(clockCounterLeftData[property]) // @ts-ignore
            : parseFloat(clockCounterLeftData[property]) - parseFloat(clockCounterRightData[property]);
        } else {
          // @ts-ignore
          if (clockCounterRightData[property] > clockCounterLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (clockCounterRightData[property] === clockCounterLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    // @ts-ignore
    if (detail.key === 'name') {
      // @ts-ignore
      this.clockCounterSource.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      // @ts-ignore
      this.clockCounterSource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.clockCounterTbl!.recycleDataSource = this.clockCounterSource;
  }
}
