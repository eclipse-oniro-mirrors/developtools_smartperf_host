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
import '../../../../../base-ui/slicer/lit-slicer';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { procedurePool } from '../../../../database/Procedure';
import { VirtualMemoryEvent, VM_TYPE_MAP } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { getTabVirtualMemoryType } from '../../../../database/sql/Memory.sql';
import { TabPaneVMEventsHtml } from './TabPaneVMEvents.html';

@element('tabpane-virtualmemory-event')
export class TabPaneVirtualMemoryEvents extends BaseElement {
  // @ts-ignore
  private defaultNativeTypes = ['All', ...Object.values(VM_TYPE_MAP)];
  private nativeType: Array<string> = [...this.defaultNativeTypes];
  private vmEventTbl: LitTable | null | undefined;
  private vmEventTblData: LitTable | null | undefined;
  private vmEventProgressEL: LitProgressBar | null | undefined;
  private loadingList: number[] = [];
  private loadingPage: unknown;
  private vmEventSource: Array<VirtualMemoryEvent> = [];
  private queryVmEventDataSource: Array<VirtualMemoryEvent> = [];
  private currentSelection: SelectionParam | undefined | null;
  private statsticsSelection: Array<unknown> = [];

  set data(vmEventSelection: SelectionParam | null | undefined) {
    if (vmEventSelection === this.currentSelection) {
      return;
    }
    this.currentSelection = vmEventSelection;
    this.initFilterTypes(vmEventSelection!).then(() => {
      this.queryData(vmEventSelection!);
    });
    if (this.vmEventTbl) {
      // @ts-ignore
      this.vmEventTbl.shadowRoot.querySelector('.table').style.height =
        this.parentElement!.clientHeight - 20 - 31 + 'px';
      this.vmEventTbl.recycleDataSource = [];
    }
    if (this.vmEventTblData) {
      // @ts-ignore
      this.vmEventTblData.shadowRoot.querySelector('.table').style.height =
        this.parentElement!.clientHeight - 20 - 31 + 'px';
      this.vmEventTblData.recycleDataSource = [];
    }
  }

  connectedCallback(): void {
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.vmEventTbl) {
          // @ts-ignore
          this.vmEventTbl.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 10 - 33 + 'px';
          this.vmEventTbl.reMeauseHeight();
        }
        if (this.vmEventTblData) {
          // @ts-ignore
          this.vmEventTblData.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 10 - 33 + 'px';
          this.vmEventTblData.reMeauseHeight();
        } // @ts-ignore
        this.loadingPage.style.height = this.parentElement!.clientHeight - 24 + 'px';
      }
    }).observe(this.parentElement!);
  }

  initElements(): void {
    this.loadingPage = this.shadowRoot?.querySelector('.loading');
    this.vmEventProgressEL = this.shadowRoot?.querySelector('.vm-event-progress') as LitProgressBar;
    this.vmEventTbl = this.shadowRoot?.querySelector<LitTable>('#vm-event-tbl');
    this.vmEventTblData = this.shadowRoot?.querySelector<LitTable>('#vm-event-tbr');
    this.vmEventTbl!.addEventListener('row-click', (vmEventRowClick) => {
      // @ts-ignore
      let data = vmEventRowClick.detail.data; // @ts-ignore
      (data as unknown).isSelected = true;
      // @ts-ignore
      if ((vmEventRowClick.detail as unknown).callBack) {
        // @ts-ignore
        (vmEventRowClick.detail as unknown).callBack(true);
      }
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryStack',
        { callchainId: data.callchainId },
        undefined,
        (res: unknown) => {
          // @ts-ignore
          this.vmEventTblData!.recycleDataSource = res;
        }
      );
    });
    this.vmEventTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.vmEventSortKey = evt.detail.key;
      // @ts-ignore
      this.vmEventSortType = evt.detail.sort;
      // @ts-ignore
      this.sortVmEventTable(evt.detail.key, evt.detail.sort);
    });
    this.shadowRoot?.querySelector<TabPaneFilter>('#vm-event-filter')!.getFilterData((data: FilterData) => {
      let index = parseInt(data.firstSelect || '0');
      if (index > this.defaultNativeTypes.length - 1) {
        this.filterTypeData(this.statsticsSelection[index - this.defaultNativeTypes.length]);
      } else {
        this.filterTypeData(undefined);
      }
      this.vmEventTbl!.recycleDataSource = this.vmEventSource;
    });
  }

  async initFilterTypes(vmEventParam: SelectionParam): Promise<void> {
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#vm-event-filter');
    let typeKeys = await getTabVirtualMemoryType(vmEventParam.leftNs, vmEventParam.rightNs);
    this.defaultNativeTypes = ['All'];
    this.statsticsSelection = [];
    typeKeys.forEach((item) => {
      // @ts-ignore
      this.defaultNativeTypes.push(VM_TYPE_MAP[item.type + '']);
    });
    this.nativeType = [...this.defaultNativeTypes];
    filter!.setSelectList([...this.defaultNativeTypes], null, 'Operation Type');
    filter!.firstSelect = '0';
  }

  async fromStastics(vmEventParam: SelectionParam | unknown): Promise<void> {
    // @ts-ignore
    if (vmEventParam.fileSystemVMData === undefined) {
      return;
    }
    this.vmEventTblData!.recycleDataSource = [];
    this.vmEventTblData?.clearAllSelection(undefined);
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#vm-event-filter');
    if (this.currentSelection !== vmEventParam) {
      // @ts-ignore
      await this.initFilterTypes(vmEventParam);
    } // @ts-ignore
    let typeIndexOf = this.nativeType.indexOf(vmEventParam.fileSystemVMData.path.value);
    if (typeIndexOf === -1) {
      // @ts-ignore
      this.statsticsSelection.push(vmEventParam.fileSystemVMData.path); // @ts-ignore
      this.nativeType.push(vmEventParam.fileSystemVMData.path.value);
      typeIndexOf = this.nativeType.length - 1;
    }
    if (this.currentSelection !== vmEventParam) {
      // @ts-ignore
      this.currentSelection = vmEventParam;
      filter!.setSelectList(this.nativeType, null, 'Operation Type');
      filter!.firstSelect = typeIndexOf + ''; // @ts-ignore
      this.queryData(vmEventParam);
    } else {
      if (typeIndexOf === parseInt(filter!.firstSelect)) {
        return;
      }
      filter!.setSelectList(this.nativeType, null, 'Operation Type');
      filter!.firstSelect = typeIndexOf + ''; // @ts-ignore
      this.filterTypeData(vmEventParam?.fileSystemVMData?.path || undefined); // @ts-ignore
      vmEventParam.fileSystemVMData = undefined;
      this.vmEventTbl!.recycleDataSource = this.vmEventSource;
    }
  }

  queryData(vmEventParam: SelectionParam): void {
    this.loadingList.push(1);
    this.vmEventProgressEL!.loading = true; // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    this.vmEventSource = [];
    this.queryVmEventDataSource = [];
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-queryVMEvents',
      {
        leftNs: vmEventParam.leftNs,
        rightNs: vmEventParam.rightNs,
        typeArr: vmEventParam.fileSystemType,
      },
      undefined,
      (res: unknown) => {
        // @ts-ignore
        this.vmEventSource = this.vmEventSource.concat(res.data); // @ts-ignore
        this.queryVmEventDataSource = this.queryVmEventDataSource.concat(res.data);
        // @ts-ignore
        this.filterTypeData(vmEventParam?.fileSystemVMData?.path || undefined);
        vmEventParam.fileSystemVMData = undefined; // @ts-ignore
        res.data = null; // @ts-ignore
        if (!res.isSending) {
          this.vmEventTbl!.recycleDataSource = this.vmEventSource;
          this.loadingList.splice(0, 1);
          if (this.loadingList.length === 0) {
            this.vmEventProgressEL!.loading = false; // @ts-ignore
            this.loadingPage.style.visibility = 'hidden';
          }
        }
      }
    );
  }

  filterTypeData(pathData: unknown): void {
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#vm-event-filter');
    let firstSelect = filter!.firstSelect;
    let type = -1;
    let tid = -1;
    let pid = -1;
    if (parseInt(firstSelect) <= this.defaultNativeTypes.length - 1) {
      // @ts-ignore
      let typeEntry = Object.entries(VM_TYPE_MAP).find((entry) => {
        return entry[1] === this.defaultNativeTypes[parseInt(firstSelect)];
      });
      type = typeEntry ? parseInt(typeEntry[0]) : 0;
    } else if (pathData !== undefined) {
      // @ts-ignore
      type = parseInt(pathData.type || 0); // @ts-ignore
      tid = pathData.tid || -1; // @ts-ignore
      pid = pathData.pid || -1;
    } else if (pathData === undefined) {
      return;
    }
    let isTidFilter = false;
    let isPidFilter = false;
    let isTypeFilter = false;
    this.vmEventSource = this.queryVmEventDataSource.filter((item) => {
      if (tid === -1) {
        isTidFilter = true;
      } else {
        isTidFilter = item.tid === tid;
      }
      if (pid === -1) {
        isPidFilter = true;
      } else {
        isPidFilter = item.pid === pid;
      }
      isTypeFilter = type === 0 || item.type === type;
      return isTidFilter && isPidFilter && isTypeFilter;
    });
  }

  sortVmEventTable(key: string, type: number): void {
    if (type === 0) {
      this.vmEventTbl!.recycleDataSource = this.vmEventSource;
    } else {
      let arr = Array.from(this.vmEventSource);
      arr.sort((vmEventA, vmEventB): number => {
        if (key === 'startTsStr') {
          if (type === 1) {
            return vmEventA.startTs - vmEventB.startTs;
          } else {
            return vmEventB.startTs - vmEventA.startTs;
          }
        } else if (key === 'durStr') {
          if (type === 1) {
            return vmEventA.dur - vmEventB.dur;
          } else {
            return vmEventB.dur - vmEventA.dur;
          }
        } else if (key === 'thread') {
          if (vmEventA.thread > vmEventB.thread) {
            return type === 2 ? 1 : -1;
          } else if (vmEventA.thread === vmEventB.thread) {
            return 0;
          } else {
            return type === 2 ? -1 : 1;
          }
        } else if (key === 'sizeStr') {
          if (type === 1) {
            return vmEventA.size - vmEventB.size;
          } else {
            return vmEventB.size - vmEventA.size;
          }
        } else {
          return 0;
        }
      });
      this.vmEventTbl!.recycleDataSource = arr;
    }
  }

  initHtml(): string {
    return TabPaneVMEventsHtml;
  }
}
