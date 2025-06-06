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


export class ChartStruct {
  depth: number = 0;
  symbol: string = '';
  lib: string = '';
  path: string = '';
  addr: string = '';
  size: number = 0;
  count: number = 0;
  eventCount: number = 0;
  eventPercent: string = '';
  dur: number = 0;
  parent: ChartStruct | undefined;
  children: Array<ChartStruct> = [];
  isSearch: boolean = false;
  tsArray: Array<number> = []; // 每个绘制的函数由哪些时间点的样本组成
  countArray: Array<number> = []; // native hook统计模式下一个时间点有多次分配
  durArray: Array<number> = [];
  isThread: boolean = false;
  isProcess: boolean = false;
  sourceFile: string = '';
  lineNumber: Set<number> = new Set<number>();
}

export class Msg {
  tag: string = '';
  index: number = 0;
  isSending: boolean = false;
  data: Array<unknown> = [];
}

export class HiPerfSymbol {
  id: number = 0;
  startTime: number = 0;
  eventCount: number = 0;
  endTime: number = 0;
  totalTime: number = 0;
  fileId: number = 0;
  symbolId: number = 0;
  cpu_id: number = 0;
  depth: number = 0;
  children?: Array<HiPerfSymbol>;
  callchain_id: number = 0;
  thread_id: number = 0;
  name: string = '';

  public clone(): HiPerfSymbol {
    const cloneSymbol = new HiPerfSymbol();
    cloneSymbol.children = [];
    cloneSymbol.depth = this.depth;
    return cloneSymbol;
  }
}

export class MerageBean extends ChartStruct {
  #parentNode: MerageBean | undefined = undefined;
  #total = 0;
  parent: MerageBean | undefined = undefined;
  id: string = '';
  parentId: string = '';
  self?: string = '0s';
  weight?: string;
  weightPercent?: string;
  selfDur: number = 0;
  dur: number = 0;
  pid: number = 0;
  canCharge: boolean = true;
  isStore = 0;
  isSelected: boolean = false;
  searchShow: boolean = true;
  children: MerageBean[] = [];
  initChildren: MerageBean[] = [];
  type: number = 0;
  set parentNode(data: MerageBean | undefined) {
    this.parent = data;
    this.#parentNode = data;
  }

  get parentNode(): MerageBean | undefined {
    return this.#parentNode;
  }

  set total(data: number) {
    this.#total = data;
    this.weight = `${getProbablyTime(this.dur)}`;
    this.weightPercent = `${((this.dur / data) * 100).toFixed(1)}%`;
  }

  get total(): number {
    return this.#total;
  }
}

class MerageBeanDataSplit {
  systmeRuleName = '/system/';
  numRuleName = '/max/min/';

  //所有的操作都是针对整个树结构的, 不区分特定的数据
  splitTree(
    splitMapData: unknown,
    data: MerageBean[],
    name: string,
    isCharge: boolean,
    isSymbol: boolean,
    currentTreeList: ChartStruct[],
    searchValue: string
  ): void {
    data.forEach((process) => {
      process.children = [];
      if (isCharge) {
        this.recursionChargeInitTree(splitMapData, process, name, isSymbol);
      } else {
        this.recursionPruneInitTree(splitMapData, process, name, isSymbol);
      }
    });
    this.resetAllNode(data, currentTreeList, searchValue);
  }

  recursionChargeInitTree(splitMapData: unknown, node: MerageBean, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && node.symbol === symbolName) || (!isSymbol && node.lib === symbolName)) {
      //@ts-ignore
      (splitMapData[symbolName] = splitMapData[symbolName] || []).push(node);
      node.isStore++;
    }
    if (node.initChildren.length > 0) {
      node.initChildren.forEach((child) => {
        this.recursionChargeInitTree(splitMapData, child, symbolName, isSymbol);
      });
    }
  }

  recursionPruneInitTree(splitMapData: unknown, node: MerageBean, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && node.symbol === symbolName) || (!isSymbol && node.lib === symbolName)) {
      //@ts-ignore
      (splitMapData[symbolName] = splitMapData[symbolName] || []).push(node);
      node.isStore++;
      this.pruneChildren(splitMapData, node, symbolName);
    } else if (node.initChildren.length > 0) {
      node.initChildren.forEach((child) => {
        this.recursionPruneInitTree(splitMapData, child, symbolName, isSymbol);
      });
    }
  }

  //symbol lib prune
  recursionPruneTree(node: MerageBean, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && node.symbol === symbolName) || (!isSymbol && node.lib === symbolName)) {
      node.parent && node.parent.children.splice(node.parent.children.indexOf(node), 1);
    } else {
      node.children.forEach((child) => {
        this.recursionPruneTree(child, symbolName, isSymbol);
      });
    }
  }

  recursionChargeByRule(
    splitMapData: unknown,
    node: MerageBean,
    ruleName: string,
    rule: (node: MerageBean) => boolean
  ): void {
    if (node.initChildren.length > 0) {
      node.initChildren.forEach((child) => {
        if (rule(child)) {
          //@ts-ignore
          (splitMapData[ruleName] = splitMapData[ruleName] || []).push(child);
          child.isStore++;
        }
        this.recursionChargeByRule(splitMapData, child, ruleName, rule);
      });
    }
  }

  pruneChildren(splitMapData: unknown, node: MerageBean, symbolName: string): void {
    if (node.initChildren.length > 0) {
      node.initChildren.forEach((child) => {
        child.isStore++;
        //@ts-ignore
        (splitMapData[symbolName] = splitMapData[symbolName] || []).push(child);
        this.pruneChildren(splitMapData, child, symbolName);
      });
    }
  }

  hideSystemLibrary(allProcess: MerageBean[], splitMapData: unknown): void {
    allProcess.forEach((item) => {
      item.children = [];
      this.recursionChargeByRule(splitMapData, item, this.systmeRuleName, (node) => {
        return node.path.startsWith(this.systmeRuleName);
      });
    });
  }

  hideNumMaxAndMin(allProcess: MerageBean[], splitMapData: unknown, startNum: number, endNum: string): void {
    let max = endNum === '∞' ? Number.POSITIVE_INFINITY : parseInt(endNum);
    allProcess.forEach((item) => {
      item.children = [];
      this.recursionChargeByRule(splitMapData, item, this.numRuleName, (node) => {
        return node.count < startNum || node.count > max;
      });
    });
  }

  resotreAllNode(splitMapData: unknown, symbols: string[]): void {
    symbols.forEach((symbol) => {
      //@ts-ignore
      let list = splitMapData[symbol];
      if (list !== undefined) {
        list.forEach((item: unknown) => {
          //@ts-ignore
          item.isStore--;
        });
      }
    });
  }

  resetAllNode(data: MerageBean[], currentTreeList: ChartStruct[], searchValue: string): void {
    // 去除全部节点上次筛选的标记
    this.clearSearchNode(currentTreeList);
    // 去除线程上次筛选的标记
    data.forEach((process) => {
      process.searchShow = true;
      process.isSearch = false;
    });
    // 恢复上次筛选
    this.resetNewAllNode(data, currentTreeList);
    if (searchValue !== '') {
      // 将筛选匹配的节点做上标记，search = true，否则都是false
      this.findSearchNode(data, searchValue, false);
      // 将searchshow为true的节点整理树结构，其余的不管
      this.resetNewAllNode(data, currentTreeList);
    }
  }

  resetNewAllNode(data: MerageBean[], currentTreeList: ChartStruct[]): void {
    data.forEach((process) => {
      process.children = [];
    });
    // 所有节点的children都置空
    let values = currentTreeList.map((item: ChartStruct) => {
      item.children = [];
      return item;
    });
    values.forEach((item: unknown) => {
      //@ts-ignore
      if (item.parentNode !== undefined) {
        //@ts-ignore
        if (item.isStore === 0 && item.searchShow) {
          /*
          拿到当前节点的父节点，如果它的父节点没有被搜索，则找到它父节点的父节点
          */
          //@ts-ignore
          let parentNode = item.parentNode;
          while (parentNode !== undefined && !(parentNode.isStore === 0 && parentNode.searchShow) && parentNode.addr) {
            parentNode = parentNode.parentNode;
          }
          if (parentNode) {
            //@ts-ignore
            item.currentTreeParentNode = parentNode;
            parentNode.children.push(item);
          }
        }
      }
    });
  }

  findSearchNode(data: MerageBean[], search: string, parentSearch: boolean): void {
    search = search.toLocaleLowerCase();
    data.forEach((item) => {
      if ((item.symbol && item.symbol.toLocaleLowerCase().includes(search)) || parentSearch) {
        item.searchShow = true;
        item.isSearch = item.symbol !== undefined && item.symbol.toLocaleLowerCase().includes(search);
        let parentNode = item.parent;
        while (parentNode && !parentNode.searchShow) {
          parentNode.searchShow = true;
          parentNode = parentNode.parent;
        }
      } else {
        item.searchShow = false;
        item.isSearch = false;
      }
      if (item.children.length > 0) {
        this.findSearchNode(item.children, search, item.searchShow);
      }
    });
  }

  clearSearchNode(currentTreeList: ChartStruct[]): void {
    currentTreeList.forEach((node) => {
      //@ts-ignore
      node.searchShow = true;
      node.isSearch = false;
    });
  }

  splitAllProcess(allProcess: unknown[], splitMapData: unknown, list: unknown): void {
    //@ts-ignore
    list.forEach((item: unknown) => {
      allProcess.forEach((process) => {
        //@ts-ignore
        if (item.select === '0') {
          //@ts-ignore
          this.recursionChargeInitTree(splitMapData, process, item.name, item.type === 'symbol');
        } else {
          //@ts-ignore
          this.recursionPruneInitTree(splitMapData, process, item.name, item.type === 'symbol');
        }
      });
      //@ts-ignore
      if (!item.checked) {
        //@ts-ignore
        this.resotreAllNode(splitMapData, [item.name]);
      }
    });
  }
}

export let merageBeanDataSplit = new MerageBeanDataSplit();

export abstract class LogicHandler {
  abstract handle(data: unknown): void;
  queryData(eventId: string, queryName: string, sql: string, args: unknown): void {
    self.postMessage({
      id: eventId,
      type: queryName,
      isQuery: true,
      args: args,
      sql: sql,
    });
  }

  abstract clearAll(): void;
}

let dec = new TextDecoder();

export let setFileName = (path: string): string => {
  let fileName = '';
  if (path) {
    let number = path.lastIndexOf('/');
    if (number > 0) {
      fileName = path.substring(number + 1);
      return fileName;
    }
  }
  return path;
};

let pagination = (page: number, pageSize: number, source: Array<unknown>): unknown[] => {
  let offset = (page - 1) * pageSize;
  return offset + pageSize >= source.length
    ? source.slice(offset, source.length)
    : source.slice(offset, offset + pageSize);
};

const PAGE_SIZE: number = 50_0000;
export let postMessage = (id: unknown, action: string, results: Array<unknown>, pageSize: number = PAGE_SIZE): void => {
  if (results.length > pageSize) {
    let pageCount = Math.ceil(results.length / pageSize);
    for (let i = 1; i <= pageCount; i++) {
      let tag = 'start';
      if (i === 1) {
        tag = 'start';
      } else if (i === pageCount) {
        tag = 'end';
      } else {
        tag = 'sending';
      }
      let msg = new Msg();
      msg.tag = tag;
      msg.index = i;
      msg.isSending = tag !== 'end';
      msg.data = pagination(i, PAGE_SIZE, results);
      self.postMessage({
        id: id,
        action: action,
        isSending: msg.tag !== 'end',
        results: msg,
      });
    }
    results.length = 0;
  } else {
    let msg = new Msg();
    msg.tag = 'end';
    msg.index = 0;
    msg.isSending = false;
    msg.data = results;
    self.postMessage({ id: id, action: action, results: msg });
    results.length = 0;
  }
};
export let translateJsonString = (str: string): string => {
  return str //   .padding
    .replace(/[\t|\r|\n]/g, '')
    .replace(/\\/g, '\\\\');
};

export let convertJSON = (arrBuf: ArrayBuffer | Array<unknown>): unknown[] => {
  if (arrBuf instanceof ArrayBuffer) {
    let string = dec.decode(arrBuf);
    let jsonArray = [];
    string = string.substring(string.indexOf('\n') + 1);
    if (!string) {
    } else {
      let parse;
      let tansStr = translateJsonString(string);
      try {
        parse = JSON.parse(translateJsonString(string));
      } catch {
        tansStr = tansStr.replace(/[^\x20-\x7E]/g, '?'); //匹配乱码字符，将其转换为？
        parse = JSON.parse(tansStr);
      }
      let columns = parse.columns;
      let values = parse.values;
      for (let i = 0; i < values.length; i++) {
        let object = {};
        for (let j = 0; j < columns.length; j++) {
          //@ts-ignore
          object[columns[j]] = values[i][j];
        }
        jsonArray.push(object);
      }
    }
    return jsonArray;
  } else {
    return arrBuf;
  }
};

export let getByteWithUnit = (bytes: number): string => {
  if (bytes < 0) {
    return '-' + getByteWithUnit(Math.abs(bytes));
  }
  let currentBytes = bytes;
  let kb1 = 1 << 10;
  let mb = (1 << 10) << 10;
  let gb = ((1 << 10) << 10) << 10; // 1 gb
  let res = '';
  if (currentBytes > gb) {
    res += (currentBytes / gb).toFixed(2) + ' GB';
  } else if (currentBytes > mb) {
    res += (currentBytes / mb).toFixed(2) + ' MB';
  } else if (currentBytes > kb1) {
    res += (currentBytes / kb1).toFixed(2) + ' KB';
  } else {
    res += Math.round(currentBytes) + ' byte';
  }
  return res;
};

export let getTimeString = (ns: number): string => {
  let currentNs = ns;
  let hour1 = 3600_000_000_000;
  let minute1 = 60_000_000_000;
  let second1 = 1_000_000_000;
  let millisecond1 = 1_000_000;
  let microsecond1 = 1_000;
  let res = '';
  if (currentNs >= hour1) {
    res += Math.floor(currentNs / hour1) + 'h ';
    currentNs = currentNs - Math.floor(currentNs / hour1) * hour1;
  }
  if (currentNs >= minute1) {
    res += Math.floor(currentNs / minute1) + 'm ';
    currentNs = currentNs - Math.floor(ns / minute1) * minute1;
  }
  if (currentNs >= second1) {
    res += Math.floor(currentNs / second1) + 's ';
    currentNs = currentNs - Math.floor(currentNs / second1) * second1;
  }
  if (currentNs >= millisecond1) {
    res += Math.floor(currentNs / millisecond1) + 'ms ';
    currentNs = currentNs - Math.floor(currentNs / millisecond1) * millisecond1;
  }
  if (currentNs >= microsecond1) {
    res += Math.floor(currentNs / microsecond1) + 'μs ';
    currentNs = currentNs - Math.floor(currentNs / microsecond1) * microsecond1;
  }
  if (currentNs > 0) {
    res += currentNs + 'ns ';
  }
  if (res === '') {
    res = ns + '';
  }
  return res;
};

export function getProbablyTime(ns: number): string {
  let currentNs = ns;
  let hour1 = 3600_000_000_000;
  let minute1 = 60_000_000_000;
  let second1 = 1_000_000_000;
  let millisecond1 = 1_000_000;
  let microsecond1 = 1_000;
  let res = '';
  if (currentNs >= hour1) {
    res += (currentNs / hour1).toFixed(2) + 'h ';
  } else if (currentNs >= minute1) {
    res += (currentNs / minute1).toFixed(2) + 'm ';
  } else if (currentNs >= second1) {
    res += (currentNs / second1).toFixed(2) + 's ';
  } else if (currentNs >= millisecond1) {
    res += (currentNs / millisecond1).toFixed(2) + 'ms ';
  } else if (currentNs >= microsecond1) {
    res += (currentNs / microsecond1).toFixed(2) + 'μs ';
  } else if (currentNs > 0) {
    res += currentNs.toFixed(0) + 'ns ';
  } else if (res === '') {
    res = ns + '';
  }
  return res;
}

export function getThreadUsageProbablyTime(ns: number): string {
  let currentNs = ns;
  let microsecond1 = 1_000;
  let res = '';
  if (currentNs > 0) {
    res += (currentNs / microsecond1).toFixed(2);
  } else if (res === '') {
    res = ns + '';
  }
  return res;
}

export function timeMsFormat2p(timeNs: number): string {
  let currentNs = timeNs;
  let oneHour = 3600_000;
  let oneMinute1 = 60_000;
  let oneSecond = 1_000; // 1 second
  let commonResult = '';
  if (currentNs >= oneHour) {
    commonResult += Math.floor(currentNs / oneHour).toFixed(2) + 'h';
    return commonResult;
  }
  if (currentNs >= oneMinute1) {
    commonResult += Math.floor(currentNs / oneMinute1).toFixed(2) + 'min';
    return commonResult;
  }
  if (currentNs >= oneSecond) {
    commonResult += Math.floor(currentNs / oneSecond).toFixed(2) + 's';
    return commonResult;
  }
  if (currentNs > 0) {
    commonResult += currentNs.toFixed(2) + 'ms';
    return commonResult;
  }
  if (commonResult === '') {
    commonResult = '0s';
  }
  return commonResult;
}

export function formatRealDate(date: Date, fmt: string): string {
  let obj = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let key in obj) {
    if (new RegExp('(' + key + ')').test(fmt)) {
      // @ts-ignore
      fmt = fmt.replace(
        RegExp.$1,
        // @ts-ignore
        RegExp.$1.length === 1 ? obj[key] : ('00' + obj[key]).substr(('' + obj[key]).length)
      );
    }
  }
  return fmt;
}

export function formatRealDateMs(timeNs: number): string {
  return formatRealDate(new Date(timeNs / 1000000), 'MM-dd hh:mm:ss.S');
}

export class JsProfilerSymbol {
  id: number = 0;
  nameId: number = 0;
  name: string = '';
  scriptId: number = 0;
  urlId: number = 0;
  url: string = '';
  line: number = 0;
  column: number = 0;
  hitCount: number = 0;
  childrenString?: string;
  childrenIds: Array<number> = [];
  children?: Array<JsProfilerSymbol>;
  parentId: number = 0;
  depth: number = -1;
  cpuProfilerData?: JsProfilerSymbol;

  public clone(): JsProfilerSymbol {
    const cloneSymbol = new JsProfilerSymbol();
    cloneSymbol.name = this.name;
    cloneSymbol.url = this.url;
    cloneSymbol.hitCount = this.hitCount;
    cloneSymbol.children = [];
    cloneSymbol.childrenIds = [];
    cloneSymbol.parentId = this.parentId;
    cloneSymbol.depth = this.depth;
    cloneSymbol.cpuProfilerData = this.cpuProfilerData;
    return cloneSymbol;
  }
}

export class HeapTreeDataBean {
  MoudleName: string | undefined;
  AllocationFunction: string | undefined;
  symbolId: number = 0;
  fileId: number = 0;
  startTs: number = 0;
  endTs: number = 0;
  eventType: string | undefined;
  depth: number = 0;
  heapSize: number = 0;
  eventId: number = 0;
  addr: string = '';
  callChinId: number = 0;
}

export class PerfCall {
  sampleId: number = 0;
  depth: number = 0;
  name: string = '';
}

export class FileCallChain {
  callChainId: number = 0;
  depth: number = 0;
  symbolsId: number = 0;
  pathId: number = 0;
  ip: string = '';
  isThread: boolean = false;
}

export class DataCache {
  public static instance: DataCache | undefined;
  public dataDict = new Map<number, string>();
  public eBpfCallChainsMap = new Map<number, Array<FileCallChain>>();
  public nmFileDict = new Map<number, string>();
  public nmHeapFrameMap = new Map<number, Array<HeapTreeDataBean>>();
  public perfCountToMs = 1; // 1000 / freq
  public perfCallChainMap: Map<number, PerfCall> = new Map<number, PerfCall>();
  public jsCallChain: Array<JsProfilerSymbol> | undefined;
  public jsSymbolMap = new Map<number, JsProfilerSymbol>();

  public static getInstance(): DataCache {
    if (!this.instance) {
      this.instance = new DataCache();
    }
    return this.instance;
  }

  public clearAll(): void {
    if (this.dataDict) {
      this.dataDict.clear();
    }
    this.clearEBpf();
    this.clearNM();
    this.clearPerf();
    this.clearJsCache();
  }

  public clearNM(): void {
    this.nmFileDict.clear();
    this.nmHeapFrameMap.clear();
  }

  public clearEBpf(): void {
    this.eBpfCallChainsMap.clear();
  }

  public clearJsCache(): void {
    if (this.jsCallChain) {
      this.jsCallChain.length = 0;
    }
    this.jsSymbolMap.clear();
  }

  public clearPerf(): void {
    this.perfCallChainMap.clear();
  }
}

export class InitAnalysis {
  public static instance: InitAnalysis | undefined;
  public isInitAnalysis: boolean = true;
  public static getInstance(): InitAnalysis {
    if (!this.instance) {
      this.instance = new InitAnalysis();
    }
    return this.instance;
  }
}

interface perfAsyncList {
  tid?: number;
  pid?: number;
  time?: number;
  symbol?: string;
  traceid?: string;
  eventCount?: number;
  sampleCount?: number;
  jsFuncName?: string;
  callerCallchainid?: number;
  calleeCallchainid?: number;
  asyncFuncName?: string;
  eventType?: string;
  children?: Array<perfAsyncList>;
  eventTypeId?: number;
  symbolName?: string;
  callerCallStack?: Array<perfAsyncList>;
  calleeCallStack?: Array<perfAsyncList>;
  callStackList?: Array<perfAsyncList>;
  parent?: perfAsyncList;
  isProcess?: boolean;
  isThread?: boolean;
  depth?: number;
  isSearch?: boolean;
  isJsStack?: boolean;
  lib?: string;
  isChartSelectParent?: boolean;
  isChartSelect?: boolean;
  isDraw?: boolean;
  drawDur?: number;
  drawEventCount?: number;
  drawCount?: number;
  drawSize?: number;
  searchEventCount?: number;
  searchCount?: number;
  searchDur?: number;
  searchSize?: number;
  size?: number;
  count?: number;
  dur?: number;
  tsArray?: Array<number>;
  isCharged?: boolean;
  addr?: string;
}

export function dealAsyncData(
  arr: Array<perfAsyncList>,
  perfCallChain: object,
  nmCallChain: Map<number, Array<{ addr: string, depth: number, eventId: number, fileId: number, symbolId: number }>>,
  dataDict: Map<number, string>,
  searchValue: string
): Array<perfAsyncList> {
  // 转换为小写字符
  searchValue = searchValue.toLocaleLowerCase();
  // 循环遍历每一条数据
  for (let i = 0; i < arr.length; i++) {
    let flag: boolean = false;
    // 定义每条数据的调用栈与被调用栈数组
    arr[i].calleeCallStack! = [];
    arr[i].callerCallStack! = [];
    // 从前端缓存的perfcallchain表与native_hook_frame表中拿到calleeId与callerId对应的数据
    // @ts-ignore
    let calleeCallChain = perfCallChain[arr[i].calleeCallchainid];
    let callerCallChain = nmCallChain.get(arr[i].callerCallchainid!)!;
    // 循环被调用栈数组，拿到该条采样数据对应的所有被调用栈信息
    for (let j = 0; j < calleeCallChain.length; j++) {
      let calleeStack: perfAsyncList = {};
      // 拿到每一层被调用栈栈名
      calleeStack.symbolName = dataDict.get(calleeCallChain[j].name)!;
      // 判断该条采样数据的被调用栈链中是否包含用户筛选字段
      if (calleeStack.symbolName.toLocaleLowerCase().indexOf(searchValue) !== -1) {
        flag = true;
      }
      // 获取calleeCallchainid、depth、eventTypeId、lib、addr
      calleeStack.calleeCallchainid = arr[i].calleeCallchainid!;
      calleeStack.depth = calleeCallChain[j].depth;
      calleeStack.eventTypeId = arr[i].eventTypeId!;
      calleeStack.lib = calleeCallChain[j].fileName;
      calleeStack.addr = `${'0x'}${calleeCallChain[j].vaddrInFile.toString(16)}`;
      // 填充到该条数据的被调用栈数组中
      arr[i].calleeCallStack!.push(calleeStack);
    }
    for (let z = 0; z < callerCallChain.length; z++) {
      let callerStack: perfAsyncList = {};
      // 拿到每一层被调用栈栈名
      callerStack.symbolName = dataDict.get(callerCallChain[z].symbolId)!;
      // 判断该条采样数据的调用栈链中是否包含用户筛选字段
      if (callerStack.symbolName.toLocaleLowerCase().indexOf(searchValue) !== -1) {
        flag = true;
      }
      // 获取callerCallchainid、depth、eventTypeId、lib、addr
      callerStack.callerCallchainid = arr[i].callerCallchainid!;
      callerStack.depth = callerCallChain[z].depth;
      callerStack.eventTypeId = arr[i].eventTypeId!;
      callerStack.addr = callerCallChain[z].addr;
      callerStack.lib = setFileName(dataDict.get(callerCallChain[z].fileId)!);
      // 填充到该条数据的调用栈数组中
      arr[i].callerCallStack!.push(callerStack);
    }
    // 若存在用户筛选字段内容，数据进行保留。若不存在，则在返回给前端的数据中删除此条数据，减少前端处理的数据量
    if (!flag) {
      arr.splice(i, 1);
      i--;
    }
  }
  return arr;
}