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

import { convertJSON, LogicHandler } from './ProcedureLogicWorkerCommon';

interface SPT {
  title: string;
  count: number;
  wallDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: string;
  children: Array<SPT>;
  state: string;
  pid: number;
  tid: number;
}

export class ProcedureLogicWorkerSPT extends LogicHandler {
  threadSlice: Array<ThreadSlice> = [];
  currentEventId: string = '';

  clearAll(): void {
    this.threadSlice.length = 0;
  }

  handle(data: unknown): void {
    //@ts-ignore
    this.currentEventId = data.id;
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      switch (data.type) {
        case 'spt-init':
          this.sptInit(data);
          break;
        case 'spt-getPTS':
          //@ts-ignore
          this.sptGetPTS(data.params);
          break;
        case 'spt-getSPT':
          //@ts-ignore
          this.sptGetSPT(data.params);
          break;
        case 'spt-getCpuPriority':
          this.sptGetCpuPriority();
          break;
        case 'spt-getCpuPriorityByTime':
          //@ts-ignore
          this.sptGetCpuPriorityByTime(data.params);
          break;
      }
    }
  }
  private sptInit(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      this.threadSlice = convertJSON(data.params.list);
      self.postMessage({
        id: this.currentEventId,
        action: 'spt-init',
        results: [],
      });
    } else {
      this.getThreadState();
    }
  }

  private sptGetPTS(params: { leftNs: number; rightNs: number; cpus: Array<number> }): void {
    self.postMessage({
      id: this.currentEventId,
      action: 'spt-getPTS',
      results: this.getPTSData(params.leftNs, params.rightNs, params.cpus),
    });
  }
  private sptGetSPT(params: { leftNs: number; rightNs: number; cpus: Array<number> }): void {
    self.postMessage({
      id: this.currentEventId,
      action: 'spt-getSPT',
      results: this.getSPTData(params.leftNs, params.rightNs, params.cpus),
    });
  }
  private sptGetCpuPriority(): void {
    self.postMessage({
      id: this.currentEventId,
      action: 'spt-getCpuPriority',
      results: this.threadSlice,
    });
  }
  private sptGetCpuPriorityByTime(params: { leftNs: number; rightNs: number; cpus: Array<number> }): void {
    const result = this.threadSlice.filter((item: ThreadSlice) => {
      return !(item.endTs! < params.leftNs || item.startTs! > params.rightNs);
    });
    self.postMessage({
      id: this.currentEventId,
      action: 'spt-getCpuPriorityByTime',
      results: result,
    });
  }
  queryData(queryName: string, sql: string, args: unknown): void {
    self.postMessage({
      id: this.currentEventId,
      type: queryName,
      isQuery: true,
      args: args,
      sql: sql,
    });
  }

  getThreadState(): void {
    this.queryData(
      'spt-init',
      `
    select
       state,
       dur,
       (ts - start_ts) as startTs,
       (ts - start_ts + dur) as endTs,
       cpu,
       tid,
       itid as itId,
       arg_setid as argSetID,
       pid
from thread_state,trace_range where dur > 0 and (ts - start_ts) >= 0;
`,
      {}
    );
  }

  private getPTSData(ptsLeftNs: number, ptsRightNs: number, cpus: Array<number>): unknown[] {
    let ptsFilter = this.threadSlice.filter(
      (it) =>
        Math.max(ptsLeftNs, it.startTs!) < Math.min(ptsRightNs, it.startTs! + it.dur!) &&
        (it.cpu === null || it.cpu === undefined || cpus.includes(it.cpu))
    );
    let group: unknown = {};
    ptsFilter.forEach((slice) => {
      let title = `S-${slice.state}`;
      let item = this.setStateData(slice, title) as SPT;
      //@ts-ignore
      if (group[`${slice.pid}`]) {
        //@ts-ignore
        let process = group[`${slice.pid}`] as SPT;
        process.count += 1;
        process.wallDuration += slice.dur!;
        process.minDuration = Math.min(process.minDuration, slice.dur!);
        process.maxDuration = Math.max(process.maxDuration, slice.dur!);
        process.avgDuration = (process.wallDuration / process.count).toFixed(2);
        let thread = process.children.find((child: SPT) => child.title === `T-${slice.tid}`);
        if (thread) {
          thread.count += 1;
          thread.wallDuration += slice.dur!;
          thread.minDuration = Math.min(thread.minDuration, slice.dur!);
          thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
          thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2);
          let state = thread.children.find((child: SPT) => child.title === `S-${slice.state}`);
          if (state) {
            state.count += 1;
            state.wallDuration += slice.dur!;
            state.minDuration = Math.min(state.minDuration, slice.dur!);
            state.maxDuration = Math.max(state.maxDuration, slice.dur!);
            state.avgDuration = (state.wallDuration / state.count).toFixed(2);
          } else {
            thread.children.push(item);
          }
        } else {
          let processChild = this.setThreadData(slice, item) as SPT;
          process.children.push(processChild);
        }
      } else {
        //@ts-ignore
        group[`${slice.pid}`] = this.setProcessData(slice, item);
      }
    });
    //@ts-ignore
    return Object.values(group);
  }
  private setStateData(slice: ThreadSlice, title: string): unknown {
    return {
      title: title,
      count: 1,
      state: slice.state,
      tid: slice.tid,
      pid: slice.pid,
      minDuration: slice.dur || 0,
      maxDuration: slice.dur || 0,
      wallDuration: slice.dur || 0,
      avgDuration: `${slice.dur}`,
    };
  }
  private setProcessData(slice: ThreadSlice, item: SPT): unknown {
    return {
      title: `P-${slice.pid}`,
      count: 1,
      pid: slice.pid,
      minDuration: slice.dur || 0,
      maxDuration: slice.dur || 0,
      wallDuration: slice.dur || 0,
      avgDuration: `${slice.dur}`,
      children: [
        {
          title: `T-${slice.tid}`,
          count: 1,
          pid: slice.pid,
          tid: slice.tid,
          minDuration: slice.dur || 0,
          maxDuration: slice.dur || 0,
          wallDuration: slice.dur || 0,
          avgDuration: `${slice.dur}`,
          children: [item],
        },
      ],
    };
  }
  private setThreadData(slice: ThreadSlice, item: SPT): unknown {
    return {
      title: `T-${slice.tid}`,
      count: 1,
      tid: slice.tid,
      pid: slice.pid,
      minDuration: slice.dur || 0,
      maxDuration: slice.dur || 0,
      wallDuration: slice.dur || 0,
      avgDuration: `${slice.dur}`,
      children: [item],
    };
  }
  private getSPTData(sptLeftNs: number, sptRightNs: number, cpus: Array<number>): unknown {
    let sptFilter = this.threadSlice.filter(
      (it) =>
        Math.max(sptLeftNs, it.startTs!) < Math.min(sptRightNs, it.startTs! + it.dur!) &&
        (it.cpu === null || it.cpu === undefined || cpus.includes(it.cpu))
    );
    let group: unknown = {};
    sptFilter.forEach((slice) => {
      let item = {
        title: `T-${slice.tid}`,
        count: 1,
        state: slice.state,
        pid: slice.pid,
        tid: slice.tid,
        minDuration: slice.dur || 0,
        maxDuration: slice.dur || 0,
        wallDuration: slice.dur || 0,
        avgDuration: `${slice.dur}`,
      } as SPT;
      //@ts-ignore
      if (group[`${slice.state}`]) {
        this.setSPTData(group, slice, item);
      } else {
        //@ts-ignore
        group[`${slice.state}`] = {
          title: `S-${slice.state}`,
          count: 1,
          state: slice.state,
          minDuration: slice.dur || 0,
          maxDuration: slice.dur || 0,
          wallDuration: slice.dur || 0,
          avgDuration: `${slice.dur}`,
          children: [
            {
              title: `P-${slice.pid}`,
              count: 1,
              state: slice.state,
              pid: slice.pid,
              minDuration: slice.dur || 0,
              maxDuration: slice.dur || 0,
              wallDuration: slice.dur || 0,
              avgDuration: `${slice.dur}`,
              children: [item],
            },
          ],
        };
      }
    });
    //@ts-ignore
    return Object.values(group);
  }
  private setSPTData(group: unknown, slice: ThreadSlice, item: SPT): void {
    //@ts-ignore
    let state = group[`${slice.state}`];
    state.count += 1;
    state.wallDuration += slice.dur;
    state.minDuration = Math.min(state.minDuration, slice.dur!);
    state.maxDuration = Math.max(state.maxDuration, slice.dur!);
    state.avgDuration = (state.wallDuration / state.count).toFixed(2);
    let process = state.children.find((child: SPT) => child.title === `P-${slice.pid}`);
    if (process) {
      process.count += 1;
      process.wallDuration += slice.dur;
      process.minDuration = Math.min(process.minDuration, slice.dur!);
      process.maxDuration = Math.max(process.maxDuration, slice.dur!);
      process.avgDuration = (process.wallDuration / process.count).toFixed(2);
      let thread = process.children.find((child: SPT) => child.title === `T-${slice.tid}`);
      if (thread) {
        thread.count += 1;
        thread.wallDuration += slice.dur;
        thread.minDuration = Math.min(thread.minDuration, slice.dur!);
        thread.maxDuration = Math.max(thread.maxDuration, slice.dur!);
        thread.avgDuration = (thread.wallDuration / thread.count).toFixed(2);
      } else {
        process.children.push(item);
      }
    } else {
      state.children.push({
        title: `P-${slice.pid}`,
        count: 1,
        state: slice.state,
        pid: slice.pid,
        minDuration: slice.dur || 0,
        maxDuration: slice.dur || 0,
        wallDuration: slice.dur || 0,
        avgDuration: `${slice.dur}`,
        children: [item],
      });
    }
  }
}

export class ThreadSlice {
  state?: string;
  dur?: number;
  startTs?: number;
  endTs?: number;
  cpu?: number | null;
  tid?: number;
  pid?: number;
  itId?: number;
  priorityType?: string;
  end_state?: string;
  priority?: number;
  argSetID?: number;
}
