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

import '../../../../../base-ui/table/lit-table-column';
import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import {
  NativeHookCallInfo,
  NativeHookSampleQueryInfo,
  NativeHookSamplerInfo,
  NativeMemory,
} from '../../../../bean/NativeHook';
import { Utils } from '../../base/Utils';
import '../TabPaneFilter';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import '../../../../../base-ui/slicer/lit-slicer';
import { procedurePool } from '../../../../database/Procedure';
import { formatRealDateMs, getTimeString } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { SpNativeMemoryChart } from '../../../chart/SpNativeMemoryChart';
import { queryAllHookData, queryNativeHookSnapshotTypes } from '../../../../database/sql/NativeHook.sql';

@element('tabpane-native-sample')
export class TabPaneNMSampleList extends BaseElement {
  static tblData: LitTable | null | undefined;
  static sampleTbl: LitTable | null | undefined;
  static filter: unknown;
  static filterSelect: string = '0';
  static samplerInfoSource: Array<NativeHookSamplerInfo> = [];
  static types: Array<string> = [];
  static nativeType: Array<string> = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'];
  static tableMarkData: Array<NativeMemory> = [];
  static selectionParam: SelectionParam | undefined = undefined;
  static sampleTypes: Array<NativeHookSampleQueryInfo> = [];
  static sampleTypesList: unknown[] = [];
  private currentSelection: SelectionParam | undefined;

  set data(sampleParam: SelectionParam | unknown) {
    if (sampleParam === this.currentSelection) {
      return;
    } // @ts-ignore
    this.currentSelection = sampleParam; // @ts-ignore
    TabPaneNMSampleList.serSelection(sampleParam);
    this.filterAllList();
  }

  static serSelection(sampleParam: SelectionParam): void {
    if (this.selectionParam !== sampleParam) {
      this.clearData();
      this.selectionParam = sampleParam;
      this.initTypes(sampleParam.nativeMemoryCurrentIPid);
    }
    if (sampleParam.nativeMemory.indexOf(this.nativeType[0]) !== -1) {
      this.types.push("'AllocEvent'");
      this.types.push("'MmapEvent'");
    } else {
      if (sampleParam.nativeMemory.indexOf(this.nativeType[1]) !== -1) {
        this.types.push("'AllocEvent'");
      }
      if (sampleParam.nativeMemory.indexOf(this.nativeType[2]) !== -1) {
        this.types.push("'MmapEvent'");
      }
    }
  }

  static initTypes(ipid: number): void {
    queryNativeHookSnapshotTypes(ipid).then((result) => {
      if (result.length > 0) {
        this.sampleTypes = result;
      }
    });
  }

  static addSampleData(data: unknown, ipid: number): void {
    // @ts-ignore
    if (TabPaneNMSampleList.tableMarkData.indexOf(data) !== -1) {
      return;
    } // @ts-ignore
    TabPaneNMSampleList.tableMarkData.push(data);
    let rootSample = new NativeHookSamplerInfo();
    rootSample.snapshot = `Snapshot${this.numberToWord(this.samplerInfoSource.length + 1)}`; // @ts-ignore
    rootSample.startTs = data.startTs;
    rootSample.timestamp =
      SpNativeMemoryChart.REAL_TIME_DIF === 0 // @ts-ignore
        ? getTimeString(data.startTs) // @ts-ignore
        : formatRealDateMs(data.startTs + SpNativeMemoryChart.REAL_TIME_DIF); // @ts-ignore
    rootSample.eventId = data.eventId; // @ts-ignore
    rootSample.threadId = data.threadId; // @ts-ignore
    rootSample.threadName = data.threadName;
    this.queryAllHookInfo(data, rootSample, ipid);
  }

  static merageSampleData(
    leftTime: number,
    startNs: number,
    rootSample: NativeHookSampleQueryInfo,
    merageSample: NativeHookSampleQueryInfo
  ): void {
    if (merageSample.endTs >= startNs) {
      rootSample.growth += merageSample.growth;
    }
    if (merageSample.startTs > leftTime) {
      rootSample.existing++;
      let childSample = new NativeHookSamplerInfo(); //新增最下层的叶子节点
      childSample.snapshot = `0x${merageSample.addr}`;
      childSample.eventId = merageSample.eventId;
      childSample.heapSize = merageSample.growth;
      childSample.growth = Utils.getByteWithUnit(merageSample.growth);
      childSample.totalGrowth = childSample.growth;
      childSample.startTs = merageSample.startTs;
      childSample.timestamp =
        SpNativeMemoryChart.REAL_TIME_DIF === 0
          ? getTimeString(merageSample.startTs)
          : formatRealDateMs(merageSample.startTs + SpNativeMemoryChart.REAL_TIME_DIF);
      childSample.threadId = merageSample.threadId;
      childSample.threadName = merageSample.threadName; // @ts-ignore
      (childSample as unknown).existing = '';
      rootSample.children.push(childSample);
    }
    rootSample.total += merageSample.growth;
  }

  static queryAllHookInfo(data: unknown, rootSample: NativeHookSamplerInfo, ipid: number): void {
    let copyTypes = this.sampleTypes.map((type) => {
      let copyType = new NativeHookSampleQueryInfo();
      copyType.eventType = type.eventType;
      copyType.subType = type.subType;
      return copyType;
    }); // @ts-ignore
    queryAllHookData(data.startTs, ipid).then((nmSamplerHookResult) => {
      if (nmSamplerHookResult.length > 0) {
        let nameGroup: unknown = {};
        copyTypes.forEach((item) => {
          // @ts-ignore
          nameGroup[item.eventType] = nameGroup[item.eventType] || []; // @ts-ignore
          nameGroup[item.eventType].push(item);
        });
        let leftTime =
          TabPaneNMSampleList.tableMarkData.length === 1
            ? 0
            : TabPaneNMSampleList.tableMarkData[TabPaneNMSampleList.tableMarkData.length - 2].startTs;
        nmSamplerHookResult.forEach((item) => {
          item.threadId = rootSample.threadId;
          item.threadName = rootSample.threadName; // @ts-ignore
          if (nameGroup[item.eventType] !== undefined) {
            if (item.subType === null) {
              // @ts-ignore
              this.merageSampleData(leftTime, data.startTs, nameGroup[item.eventType][0], item);
            } else {
              // @ts-ignore
              let filter = nameGroup[item.eventType].filter((type: unknown) => {
                // @ts-ignore
                return type.subType === item.subType;
              });
              if (filter.length > 0) {
                // @ts-ignore
                this.merageSampleData(leftTime, data.startTs, filter[0], item);
              }
            }
          }
        });
        this.updateSampleTypesList(copyTypes);
        this.createTree(nameGroup, rootSample);
        rootSample.tempList = [...rootSample.children];
        this.samplerInfoSource.push(rootSample);
        TabPaneNMSampleList.sampleTbl!.recycleDataSource = TabPaneNMSampleList.samplerInfoSource;
      }
    });
  }

  private static updateSampleTypesList(copyTypes: NativeHookSampleQueryInfo[]): void {
    if (this.sampleTypesList.length > 0) {
      let sampleTypesListElement = this.sampleTypesList[this.sampleTypesList.length - 1]; // @ts-ignore
      sampleTypesListElement.forEach((item: unknown, index: number) => {
        copyTypes[index].current = copyTypes[index].growth;
        if (index < copyTypes.length) {
          // @ts-ignore
          copyTypes[index].growth -= item.current; // @ts-ignore
          copyTypes[index].total -= item.total;
        }
      });
    } else {
      copyTypes.forEach((item: unknown) => {
        // @ts-ignore
        item.current = item.growth;
      });
    }
    this.sampleTypesList.push(copyTypes);
  }

  static createTree(nameGroup: unknown, rootSample: NativeHookSamplerInfo): void {
    // @ts-ignore
    Object.keys(nameGroup).forEach((key) => {
      let parentSample = new NativeHookSamplerInfo();
      parentSample.snapshot = key; // @ts-ignore
      if (nameGroup[key].length > 0) {
        // @ts-ignore
        nameGroup[key].forEach((child: unknown) => {
          let childSample = new NativeHookSamplerInfo(); // @ts-ignore
          childSample.snapshot = child.subType || child.eventType; // @ts-ignore
          childSample.heapSize = child.growth; // @ts-ignore
          childSample.growth = Utils.getByteWithUnit(child.growth); // @ts-ignore
          childSample.total = child.total; // @ts-ignore
          childSample.totalGrowth = Utils.getByteWithUnit(child.total); // @ts-ignore
          childSample.existing = child.existing; // @ts-ignore
          childSample.currentSize = child.current; // @ts-ignore
          childSample.current = Utils.getByteWithUnit(child.current);
          childSample.threadName = rootSample.threadName;
          childSample.threadId = rootSample.threadId;
          parentSample.merageObj(childSample);
          if (childSample.snapshot !== parentSample.snapshot) {
            //根据名称是否一致来判断是否需要添加子节点
            // @ts-ignore
            childSample.children.push(...child.children);
            parentSample.children.push(childSample);
          } else {
            // @ts-ignore
            parentSample.children.push(...child.children);
          }
        });
      }
      rootSample.merageObj(parentSample);
      rootSample.children.push(parentSample);
    });
  }

  static prepChild(currentSample: NativeHookSamplerInfo, rootSample: NativeHookSamplerInfo): void {
    currentSample.heapSize -= rootSample.heapSize;
    currentSample.growth = Utils.getByteWithUnit(currentSample.heapSize);
    let currentMap: unknown = {};
    currentSample.children.forEach((currentChild) => {
      // @ts-ignore
      currentMap[currentChild.snapshot] = currentChild;
    });
    rootSample.children.forEach((rootChild) => {
      // @ts-ignore
      if (currentMap[rootChild.snapshot] === undefined) {
        let perpSample = new NativeHookSamplerInfo();
        perpSample.snapshot = rootChild.snapshot; // @ts-ignore
        currentMap[rootChild.snapshot] = perpSample;
        currentSample.children.push(perpSample);
      } // @ts-ignore
      this.prepChild(currentMap[rootChild.snapshot], rootChild);
    });
  }

  static clearData(): void {
    this.types = [];
    this.samplerInfoSource = [];
    this.tblData!.dataSource = [];
    this.sampleTbl!.recycleDataSource = [];
    TabPaneNMSampleList.sampleTbl!.recycleDataSource = [];
    this.sampleTypesList = [];
    this.tableMarkData = []; // @ts-ignore
    TabPaneNMSampleList.filter!.firstSelect = '0';
  }

  static numberToWord(num: number): string {
    let word = '';
    while (num > 0) {
      let end = num % 26;
      end = end === 0 ? (end = 26) : end;
      word = String.fromCharCode(96 + end) + word;
      num = (num - end) / 26;
    }
    return word.toUpperCase();
  }

  startWorker(args: Map<string, unknown>, handler: Function): void {
    procedurePool.submitWithName('logic0', 'native-memory-action', args, undefined, (res: unknown) => {
      handler(res);
    });
  }

  setRightTableData(hookSamplerInfo: NativeHookSamplerInfo): void {
    let nmSamplerArgs = new Map<string, unknown>();
    nmSamplerArgs.set('eventId', hookSamplerInfo.eventId);
    nmSamplerArgs.set('actionType', 'memory-stack');
    this.startWorker(nmSamplerArgs, (results: unknown[]) => {
      let source = [];
      if (results.length > 0) {
        let hookCallInfo = new NativeHookCallInfo();
        hookCallInfo.threadId = hookSamplerInfo.threadId;
        hookCallInfo.threadName = hookSamplerInfo.threadName;
        hookCallInfo.symbol = `${hookSamplerInfo.threadName ?? ''}【${hookSamplerInfo.threadId}】`;
        hookCallInfo.type = -1;
        source.push(hookCallInfo);
        source.push(...results);
      }
      // @ts-ignore
      TabPaneNMSampleList.tblData?.dataSource = source;
    });
  }

  initElements(): void {
    TabPaneNMSampleList.sampleTbl = this.shadowRoot?.querySelector<LitTable>('#tb-native-sample');
    TabPaneNMSampleList.sampleTbl!.addEventListener('row-click', (evt: unknown) => {
      // @ts-ignore
      this.setRightTableData(evt.detail.data);
    });
    TabPaneNMSampleList.tblData = this.shadowRoot?.querySelector<LitTable>('#tb-native-data');
    TabPaneNMSampleList.filter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.setSelectList(TabPaneNMSampleList.nativeType, null, 'Allocation Type');
    this.shadowRoot?.querySelector<TabPaneFilter>('#filter')!.getFilterData((data: FilterData) => {
      if (data.firstSelect) {
        TabPaneNMSampleList.filterSelect = data.firstSelect;
        this.filterAllList();
      }
    }); // @ts-ignore
    TabPaneNMSampleList.filter!.firstSelect = TabPaneNMSampleList.filterSelect;
    TabPaneNMSampleList.sampleTbl!.exportTextHandleMap.set('totalGrowth', (value) => {
      // @ts-ignore
      return `${value.total}`;
    });
    TabPaneNMSampleList.sampleTbl!.exportTextHandleMap.set('growth', (value) => {
      // @ts-ignore
      return `${value.heapSize}`;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight !== 0) {
        // @ts-ignore
        TabPaneNMSampleList.sampleTbl?.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 10 - 31 + 'px';
        TabPaneNMSampleList.sampleTbl?.reMeauseHeight();
        // @ts-ignore
        TabPaneNMSampleList.tblData?.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 10 + 'px';
        TabPaneNMSampleList.tblData?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }

  filterAllList(): void {
    TabPaneNMSampleList.samplerInfoSource.forEach((nmRootSample) => {
      nmRootSample.heapSize = 0;
      nmRootSample.existing = 0;
      nmRootSample.total = 0;
      if (TabPaneNMSampleList.filterSelect === '0') {
        nmRootSample.children = [...nmRootSample.tempList];
        nmRootSample.tempList.forEach((parentSample) => {
          nmRootSample.heapSize += parentSample.heapSize;
          nmRootSample.existing += parentSample.existing;
          nmRootSample.total += parentSample.total;
        });
        nmRootSample.growth = Utils.getByteWithUnit(nmRootSample.heapSize);
        nmRootSample.totalGrowth = Utils.getByteWithUnit(nmRootSample.total);
      } else if (TabPaneNMSampleList.filterSelect === '2') {
        if (nmRootSample.tempList.length > 1) {
          nmRootSample.children = [nmRootSample.tempList[1]];
          nmRootSample.heapSize += nmRootSample.tempList[1].heapSize;
          nmRootSample.existing += nmRootSample.tempList[1].existing;
          nmRootSample.growth = Utils.getByteWithUnit(nmRootSample.heapSize);
          nmRootSample.total += nmRootSample.tempList[1].total;
          nmRootSample.totalGrowth = Utils.getByteWithUnit(nmRootSample.total);
        } else {
          nmRootSample.children = [];
          nmRootSample.growth = '';
          nmRootSample.totalGrowth = '';
        }
      } else {
        if (nmRootSample.tempList.length > 0) {
          nmRootSample.children = [nmRootSample.tempList[0]];
          nmRootSample.heapSize += nmRootSample.tempList[0].heapSize;
          nmRootSample.existing += nmRootSample.tempList[0].existing;
          nmRootSample.growth = Utils.getByteWithUnit(nmRootSample.heapSize);
          nmRootSample.total += nmRootSample.tempList[0].total;
          nmRootSample.totalGrowth = Utils.getByteWithUnit(nmRootSample.total);
        } else {
          nmRootSample.children = [];
          nmRootSample.growth = '';
          nmRootSample.totalGrowth = '';
        }
      }
    });
    TabPaneNMSampleList.sampleTbl!.recycleDataSource = TabPaneNMSampleList.samplerInfoSource;
  }

  initHtml(): string {
    return `
        <style>
        .nm-sample-tbl {
            height: auto;
        }
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-slicer style="width:100%">
        <div class="nm-sample-content" style="width: 65%">
            <lit-table id="tb-native-sample" class="nm-sample-tbl" tree>
                <lit-table-column class="nm-sample-column" width="25%" title="Snapshot" data-index="snapshot" key="snapshot"  align="flex-start"retract>
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Timestamp" data-index="timestamp" key="timestamp"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Net Growth" data-index="growth" key="growth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="Total Growth" data-index="totalGrowth" key="totalGrowth"  align="flex-start"  >
                </lit-table-column>
                <lit-table-column class="nm-sample-column" width="1fr" title="# Existing" data-index="existing" key="existing"  align="flex-start"  >
                </lit-table-column>
            </lit-table>
            <tab-pane-filter id="filter" first></tab-pane-filter>
        </div>
        <lit-slicer-track ></lit-slicer-track>
        <lit-table id="tb-native-data" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
            <lit-table-column class="nm-sample-column" width="80px" title="" data-index="type" key="type"  align="flex-start" >
                <template>
                    <div v-if=" type === -1 ">Thread:</div>
                    <img src="img/library.png" size="20" v-if=" type === 1 ">
                    <img src="img/function.png" size="20" v-if=" type === 0 ">
                </template>
            </lit-table-column>
            <lit-table-column class="nm-sample-column" width="1fr" title="" data-index="symbol" key="symbol"  align="flex-start">
            </lit-table-column>
        </lit-table>
        </lit-slicer>
        `;
  }
}
