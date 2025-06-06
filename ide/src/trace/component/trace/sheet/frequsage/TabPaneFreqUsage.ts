/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import {
  LitTable,
  RedrawTreeForm,
} from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import '../../../StackBar';
import { getTabRunningPercent } from '../../../../database/sql/ProcessThread.sql';
import {
  queryCpuFreqUsageData,
  queryCpuFreqFilterId,
} from '../../../../database/sql/Cpu.sql';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import {
  type CpuFreqData,
  type RunningFreqData,
  type RunningData,
  type CpuFreqTd,
} from './TabPaneFreqUsageConfig';
import { getCpuData } from '../../../../database/sql/CpuAndIrq.sql';

@element('tabpane-frequsage')
export class TabPaneFreqUsage extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | undefined;
  private worker: Worker | undefined;
  static element: TabPaneFreqUsage;
  private sortConsumpowerFlags: number = 0;
  private sortConsumptionFlags: number = 0;
  private sortCpuloadFlags: number = 0;
  private sortDurFlags: number = 0;
  private sortPercentFlags: number = 0;

  set data(threadStatesParam: SelectionParam) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    this.currentSelectionParam = threadStatesParam;
    this.threadStatesTbl!.recycleDataSource = [];
    // @ts-ignore
    this.threadStatesTbl.value = [];
    this.queryAllData(threadStatesParam);
  }

  static refresh(): void {
    this.prototype.queryAllData(TabPaneFreqUsage.element.currentSelectionParam!);
  }

  async queryAllData(threadStatesParam: SelectionParam): Promise<void> {
    TabPaneFreqUsage.element.threadStatesTbl!.loading = true;
    let runningResult: Array<RunningData> = await getTabRunningPercent(
      threadStatesParam.threadIds,
      threadStatesParam.processIds,
      threadStatesParam.leftNs,
      threadStatesParam.rightNs
    );
    // 查询cpu及id信息
    let cpuIdResult: Array<{ id: number; cpu: number }> =
      await queryCpuFreqFilterId();
    // 以键值对形式将cpu及id进行对应，后续会将频点数据与其对应cpu进行整合
    let IdMap: Map<number, number> = new Map();
    let queryId: Array<number> = [];
    let cpuArray: Array<number> = [];
    for (let i = 0; i < cpuIdResult.length; i++) {
      queryId.push(cpuIdResult[i].id);
      IdMap.set(cpuIdResult[i].id, cpuIdResult[i].cpu);
      cpuArray.push(cpuIdResult[i].cpu);
    }
    // 通过id去查询频点数据
    let cpuFreqResult: Array<CpuFreqTd> = await queryCpuFreqUsageData(queryId);
    let cpuFreqData: Array<CpuFreqData> = [];
    for (let i of cpuFreqResult) {
      cpuFreqData.push({
        ts: i.startNS + threadStatesParam.recordStartNs,
        cpu: IdMap.get(i.filter_id)!,
        value: i.value,
        dur: i.dur,
      });
    }
    const cpuData = await getCpuData(cpuArray, threadStatesParam.leftNs, threadStatesParam.rightNs);
    const LEFT_TIME: number = threadStatesParam.leftNs + threadStatesParam.recordStartNs;
    const RIGHT_TIME: number = threadStatesParam.rightNs + threadStatesParam.recordStartNs;
    const comPower =
      SpSegmentationChart.freqInfoMapData.size > 0
        ? SpSegmentationChart.freqInfoMapData
        : undefined;
    const args = {
      runData: runningResult,
      cpuFreqData: cpuFreqData,
      leftNs: LEFT_TIME,
      rightNs: RIGHT_TIME,
      cpuArray: cpuArray,
      comPower: comPower,
      broCpuData: cpuData,
      // @ts-ignore
      recordStartNS: (window as unknown).recordStartNS
    };
    TabPaneFreqUsage.element.worker!.postMessage(args);
    TabPaneFreqUsage.element.worker!.onmessage = (event: MessageEvent): void => {
      let resultArr: Array<RunningFreqData> = event.data;
      TabPaneFreqUsage.element.fixedDeal(resultArr, threadStatesParam.traceId);
      TabPaneFreqUsage.element.threadClick(resultArr);
      TabPaneFreqUsage.element.threadStatesTbl!.recycleDataSource = resultArr;
      TabPaneFreqUsage.element.threadStatesTbl!.loading = false;
    };
  }

  /**
   * 表头点击事件
   */
  private threadClick(data: Array<RunningFreqData>): void {
    let labels = this.threadStatesTbl?.shadowRoot
      ?.querySelector('.th > .td')!
      .querySelectorAll('label');
    let tabHeads = this.threadStatesTbl?.shadowRoot
      ?.querySelector('.th')!.querySelectorAll('.td');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process') && i === 0) {
            this.threadStatesTbl!.setStatus(data, false);
            this.threadStatesTbl!.recycleDs =
              this.threadStatesTbl!.meauseTreeRowElement(
                data,
                RedrawTreeForm.Retract
              );
          } else if (label.includes('Thread') && i === 1) {
            for (let item of data) {
              // @ts-ignore
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadStatesTbl!.setStatus(item.children, false);
              }
            }
            this.threadStatesTbl!.recycleDs =
              this.threadStatesTbl!.meauseTreeRowElement(
                data,
                RedrawTreeForm.Retract
              );
          } else if (label.includes('CPU') && i === 2) {
            this.threadStatesTbl!.setStatus(data, true);
            this.threadStatesTbl!.recycleDs =
              this.threadStatesTbl!.meauseTreeRowElement(
                data,
                RedrawTreeForm.Expand
              );
          }
        });
      }
    }
    if (tabHeads && tabHeads.length) {
      this.restoreFlags();
      tabHeads.forEach((item) => {
        // @ts-ignore
        switch (item.innerText) {
          case 'Consume(cap*ms)':
            item.addEventListener('click', () => { this.sortDataTree(data, 'Consume(cap*ms)') });
            break;
          case 'Consume(MHz*ms)':
            item.addEventListener('click', () => { this.sortDataTree(data, 'Consume(MHz*ms)') });
            break;
          case 'TaskUtil(%)':
            item.addEventListener('click', () => { this.sortDataTree(data, 'TaskUtil') });
            break;
          case 'Dur(ms)':
            item.addEventListener('click', () => { this.sortDataTree(data, 'Dur') });
            break;
          case 'Dur\n/All_Dur(%)':
            item.addEventListener('click', () => { this.sortDataTree(data, 'All_Dur') });
            break;
        }
      })
    }
  }

  sortDataTree(data: Array<RunningFreqData>, type: string) {
    this.threadStatesTbl!.recycleDs = this.sortTree(data, type);
    this.threadStatesTbl!.recycleDs =
      this.threadStatesTbl!.meauseTreeRowElement(
        data,
        RedrawTreeForm.Expand
      );
    switch (type) {
      case 'Consume(cap*ms)':
        this.sortConsumptionFlags = 0;
        this.sortCpuloadFlags = 0;
        this.sortDurFlags = 0;
        this.sortPercentFlags = 0;
        if (this.sortConsumpowerFlags === 2) {
          this.sortConsumpowerFlags = 0;
        } else {
          this.sortConsumpowerFlags++;
        }
        break;
      case 'Consume(MHz*ms)':
        this.sortConsumpowerFlags = 0;
        this.sortCpuloadFlags = 0;
        this.sortDurFlags = 0;
        this.sortPercentFlags = 0;
        if (this.sortConsumptionFlags === 2) {
          this.sortConsumptionFlags = 0;
        } else {
          this.sortConsumptionFlags++;
        }
        break;
      case 'TaskUtil':
        this.sortConsumpowerFlags = 0;
        this.sortConsumptionFlags = 0;
        this.sortDurFlags = 0;
        this.sortPercentFlags = 0;
        if (this.sortCpuloadFlags === 2) {
          this.sortCpuloadFlags = 0;
        } else {
          this.sortCpuloadFlags++;
        }
        break;
      case 'Dur':
        this.sortConsumpowerFlags = 0;
        this.sortConsumptionFlags = 0;
        this.sortCpuloadFlags = 0;
        this.sortPercentFlags = 0;
        if (this.sortDurFlags === 2) {
          this.sortDurFlags = 0;
        } else {
          this.sortDurFlags++;
        }
        break;
      case 'All_Dur':
        this.sortConsumpowerFlags = 0;
        this.sortConsumptionFlags = 0;
        this.sortCpuloadFlags = 0;
        this.sortDurFlags = 0;
        if (this.sortPercentFlags === 2) {
          this.sortPercentFlags = 0;
        } else {
          this.sortPercentFlags++;
        }
        break;
    }
  }

  sortTree(arr: Array<unknown>, type: string): Array<unknown> {
    if (arr.length > 1) {
      // @ts-ignore
      arr = arr.sort((sortArrA, sortArrB): number => {
        // @ts-ignore
        if (sortArrA.depth === sortArrB.depth) {
          switch (type) {
            case 'Consume(cap*ms)':
              if (this.sortConsumpowerFlags === 0) {
                //@ts-ignore
                return Number(sortArrA.consumpower) - Number(sortArrB.consumpower);
              } else if (this.sortConsumpowerFlags === 1) {
                //@ts-ignore
                return Number(sortArrB.consumpower) - Number(sortArrA.consumpower);
              } else {
                //@ts-ignore
                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
              }
              break;
            case 'Consume(MHz*ms)':
              if (this.sortConsumptionFlags === 0) {
                //@ts-ignore
                return Number(sortArrA.consumption) - Number(sortArrB.consumption);
              } else if (this.sortConsumptionFlags === 1) {
                //@ts-ignore
                return Number(sortArrB.consumption) - Number(sortArrA.consumption);
              } else {
                //@ts-ignore
                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
              }
              break;
            case 'TaskUtil':
              if (this.sortCpuloadFlags === 0) {
                //@ts-ignore
                return Number(sortArrA.cpuload) - Number(sortArrB.cpuload);
              } else if (this.sortCpuloadFlags === 1) {
                //@ts-ignore
                return Number(sortArrB.cpuload) - Number(sortArrA.cpuload);
              } else {
                //@ts-ignore
                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
              }
              break;
            case 'Dur':
              if (this.sortDurFlags === 0) {
                //@ts-ignore
                return Number(sortArrA.dur) - Number(sortArrB.dur);
              } else if (this.sortDurFlags === 1) {
                //@ts-ignore
                return Number(sortArrB.dur) - Number(sortArrA.dur);
              } else {
                //@ts-ignore
                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
              }
              break;
            case 'All_Dur':
              if (this.sortPercentFlags === 0) {
                //@ts-ignore
                return Number(sortArrA.percent) - Number(sortArrB.percent);
              } else if (this.sortPercentFlags === 1) {
                //@ts-ignore
                return Number(sortArrB.percent) - Number(sortArrA.percent);
              } else {
                //@ts-ignore
                return Number(sortArrA.cpu) - Number(sortArrB.cpu);
              }
              break;
          }
        }
      })
    }
    arr.map((call: unknown): void => {
      // @ts-ignore
      if (call.children && call.children.length > 1 && call.status) {
        // @ts-ignore
        call.children = this.sortTree(call.children, type);
      }
    })
    return arr;
  }

  restoreFlags() {
    this.sortConsumpowerFlags = 0;
    this.sortConsumptionFlags = 0;
    this.sortCpuloadFlags = 0;
    this.sortDurFlags = 0;
    this.sortPercentFlags = 0;
  }


  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>(
      '#tb-running-percent'
    );
    //开启一个线程计算busyTime
    this.worker = new Worker(
      new URL('../../../../database/TabPaneFreqUsageWorker', import.meta.url)
    );
    TabPaneFreqUsage.element = this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!, 20);
  }

  initHtml(): string {
    return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-running-percent" style="height: auto; overflow-x:auto;" tree>
          <lit-table-column class="running-percent-column" width="320px" title="Process/Thread/CPU" data-index="thread" key="thread" align="flex-start" retract>
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="100px" title="CPU" data-index="cpu" key="cpu" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="240px" title="Consume(MHz*ms)" data-index="consumption" key="consumption" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="200px" title="Freq(MHz:Cap)" data-index="frequency" key="frequency" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="240px" title="Consume(cap*ms)" data-index="consumpower" key="consumpower" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="100px" title="TaskUtil(%)" data-index="cpuload" key="cpuload" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="200px" title="Dur(ms)" data-index="dur" key="dur" align="flex-start">
          </lit-table-column>
          <lit-table-column class="running-percent-column" width="140px" title="Dur/All_Dur(%)" data-index="percent" key="percent" align="flex-start">
          </lit-table-column>
        </lit-table>
        `;
  }

  /**
   * 递归整理数据小数位
   */
  fixedDeal(arr: Array<RunningFreqData>, traceId?: string | null): void {
    if (arr == undefined) {
      return;
    }
    const TIME_MUTIPLE: number = 1000000;
    // KHz->MHz  *  ns->ms
    const CONS_MUTIPLE: number = 1000000000;
    const MIN_PERCENT: number = 2;
    const MIN_FREQ: number = 3;
    const MIN_POWER: number = 6;
    for (let i = 0; i < arr.length; i++) {
      let trackId: number;
      // 若存在空位元素则进行删除处理
      if (arr[i] === undefined) {
        arr.splice(i, 1);
        i--;
        continue;
      }
      if (arr[i].thread?.indexOf('P') !== -1) {
        trackId = Number(arr[i].thread?.slice(1)!);
        arr[i].thread = `${Utils.getInstance().getProcessMap(traceId).get(trackId) || 'Process'} ${trackId}`;
      } else if (arr[i].thread === 'summary data') {
      } else {
        trackId = Number(arr[i].thread!.split('_')[1]);
        arr[i].thread = `${Utils.getInstance().getThreadMap(traceId).get(trackId) || 'Thread'} ${trackId}`;
      }
      if (arr[i].cpu < 0) {
        // @ts-ignore
        arr[i].cpu = '';
      }
      // @ts-ignore
      if (arr[i].frequency < 0) {
        arr[i].frequency = '';
      }
      if (!arr[i].cpuload) {
        // @ts-ignore
        arr[i].cpuload = '0.000000';
      } else {
        // @ts-ignore
        arr[i].cpuload = arr[i].cpuload.toFixed(MIN_POWER);
      }
      // @ts-ignore
      arr[i].percent = arr[i].percent.toFixed(MIN_PERCENT);
      // @ts-ignore
      arr[i].dur = (arr[i].dur / TIME_MUTIPLE).toFixed(MIN_FREQ);
      // @ts-ignore
      arr[i].consumption = (arr[i].consumption / CONS_MUTIPLE).toFixed(MIN_FREQ);
      // @ts-ignore
      arr[i].consumpower = (arr[i].consumpower / TIME_MUTIPLE).toFixed(MIN_FREQ);
      if (arr[i].frequency !== '') {
        if (arr[i].frequency === 'unknown') {
          arr[i].frequency = 'unknown';
        } else {
          arr[i].frequency = arr[i].frequency;
        }
      }
      this.fixedDeal(arr[i].children!, traceId);
    }
  }
}