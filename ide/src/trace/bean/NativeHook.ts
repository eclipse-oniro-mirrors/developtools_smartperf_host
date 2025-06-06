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

import { Utils } from '../component/trace/base/Utils';
import { ChartStruct } from '../bean/FrameChartStruct';

export class NativeHookStatistics {
  eventId: number = 0;
  eventType: string = '';
  subType: string = '';
  subTypeId: number = 0;
  heapSize: number = 0;
  addr: string = '';
  startTs: number = 0;
  endTs: number = 0;
  sumHeapSize: number = 0;
  max: number = 0;
  count: number = 0;
  tid: number = 0;
  threadName: string = '';
  isSelected: boolean = false;
}

export class NativeHookMalloc {
  eventType: string = '';
  subType: string = '';
  subTypeId: number = 0;
  heapSize: number = 0;
  allocByte: number = 0;
  allocCount: number = 0;
  freeByte: number = 0;
  freeCount: number = 0;
  max: number = 0;
}

export class NativeEventHeap {
  eventType: string = '';
  sumHeapSize: number = 0;
}

export class NativeHookProcess {
  ipid: number = 0;
  pid: number = 0;
  name: String = '';
}

export class NativeHookStatisticsTableData {
  memoryTap: string = '';
  existing: number = 0;
  existingString: string = '';
  freeByteString: string = '';
  allocCount: number = 0;
  freeCount: number = 0;
  freeByte: number = 0;
  totalBytes: number = 0;
  totalBytesString: string = '';
  maxStr: string = '';
  max: number = 0;
  totalCount: number = 0;
  existingValue: Array<number> = [];
}

export class NativeMemory {
  index: number = 0;
  eventId: number = 0;
  threadId: number = 0;
  threadName: string = '';
  eventType: string = '';
  subType: string = '';
  startTs: number = 0;
  endTs: number = 0;
  timestamp: string = '';
  heapSize: number = 0;
  heapSizeUnit: string = '';
  symbol: string = '';
  library: string = '';
  isSelected: boolean = false;
  state: string = '';
  addr: string = '';
}

export class NativeHookSamplerInfo {
  current: string = '';
  currentSize: number = 0;
  startTs: number = 0;
  heapSize: number = 0;
  snapshot: string = '';
  growth: string = '';
  total: number = 0;
  totalGrowth: string = '';
  existing: number = 0;
  children: Array<NativeHookSamplerInfo> = [];
  tempList: Array<NativeHookSamplerInfo> = [];
  timestamp: string = '';
  eventId: number = -1;
  threadId: number = 0;
  threadName: string = '';

  merageObj(merageObj: NativeHookSamplerInfo): void {
    this.currentSize += merageObj.currentSize;
    this.heapSize += merageObj.heapSize;
    this.existing += merageObj.existing;
    this.total += merageObj.total;
    this.growth = Utils.getByteWithUnit(this.heapSize);
    this.current = Utils.getByteWithUnit(this.currentSize);
    this.totalGrowth = Utils.getByteWithUnit(this.total);
  }
}

export class NativeHookSampleQueryInfo {
  eventId: number = -1;
  current: number = 0;
  eventType: string = '';
  subType: string = '';
  subTypeId: number = 0;
  growth: number = 0;
  existing: number = 0;
  addr: string = '';
  startTs: number = 0;
  endTs: number = 0;
  total: number = 0;
  threadId: number = 0;
  threadName: string = '';
  children: Array<NativeHookSamplerInfo> = [];
}

export class NativeHookCallInfo extends ChartStruct {
  pid: string | undefined;
  symbolId: number = 0;
  count: number = 0;
  countValue: string = '';
  countPercent: string = '';
  type: number = 0;
  heapSize: number = 0;
  heapPercent: string = '';
  heapSizeStr: string = '';
  eventId: number = 0;
  threadId: number = 0;
  threadName: string = '';
  isSelected: boolean = false;
}

export class NativeEvent {
  startTime: number = 0;
  heapSize: number = 0;
  eventType: string = '';
}

export class NativeMemoryExpression {
  includeLib: Map<string, string[]> = new Map<string, string[]>();
  abandonLib: Map<string, string[]> = new Map<string, string[]>();
}

export class FilterByAnalysis {
  symbolId?: number;
  symbolName?: string;
  libId?: number;
  libName?: string;
  tid?: number;
  tName?: string;
  type?: string;
  typeId?: number;

  constructor(
    typeId: number | undefined,
    type: string | undefined,
    tName: string | undefined,
    tid: number | undefined,
    libId: number | undefined,
    libName: string | undefined,
    symbolId: number | undefined,
    symbolName: string | undefined
  ) {
    this.typeId = typeId;
    this.libId = libId || -1;
    this.libName = libName;
    this.tid = tid;
    this.tName = tName;
    this.symbolId = symbolId;
    this.symbolName = symbolName;
    this.type = type;
  }
}
