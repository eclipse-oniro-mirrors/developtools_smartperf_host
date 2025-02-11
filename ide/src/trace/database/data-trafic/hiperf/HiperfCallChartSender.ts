// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { QueryEnum, TraficEnum } from '../utils/QueryEnum';
import { threadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { SpSystemTrace } from '../../../component/SpSystemTrace';

export function hiperfCallChartDataSender(
  // @ts-ignore
  row: TraceRow<unknown>,
  setting: {
    startTime: number;
    eventTypeId: number;
    type: number;
    id: number;
  }
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.HiperfCallChart,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        totalNS: (TraceRow.range?.endNS || 0) - (TraceRow.range?.startNS || 0),
        frame: row.frame,
        expand: row.funcExpand,
        isComplete: row.isComplete,
        startTime: setting.startTime,
        eventTypeId: setting.eventTypeId,
        type: setting.type,
        id: setting.id,
      },
      (res: unknown, len: number): void => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function hiperfCallStackCacheSender(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.HiperfCallStack,
      {
        recordStartNS: window.recordStartNS,
        isCache: true,
        trafic: TraficEnum.TransferArrayBuffer,
      },
      (res: unknown, len: number): void => {
        resolve('ok');
      }
    );
  });
}

export function hiperfCallChartDataCacheSender(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.HiperfCallChart,
      {
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        trafic: TraficEnum.TransferArrayBuffer,
        isCache: true,
      },
      (res: unknown, len: number): void => {
        resolve('ok');
      }
    );
  });
}

function arrayBufferHandler(
  res: unknown,
  len: number
): {
  maxDepth: unknown;
  dataList: unknown[];
} {
  // @ts-ignore
  let startTs = new Float64Array(res.startTs);
  // @ts-ignore
  let dur = new Float64Array(res.dur);
  // @ts-ignore
  let depth = new Int32Array(res.depth);
  // @ts-ignore
  let eventCount = new Int32Array(res.eventCount);
  // @ts-ignore
  let symbolId = new Int32Array(res.symbolId);
  // @ts-ignore
  let fileId = new Int32Array(res.fileId);
  // @ts-ignore
  let callchainId = new Int32Array(res.callchainId);
  // @ts-ignore
  let selfDur = new Int32Array(res.selfDur);
  // @ts-ignore
  let name = new Int32Array(res.name);
  let outArr: unknown[] = [];
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTime: startTs[i],
      totalTime: dur[i],
      endTime: startTs[i] + dur[i],
      depth: depth[i],
      eventCount: eventCount[i],
      fileId: fileId[i],
      symbolId: symbolId[i],
      callchain_id: callchainId[i],
      selfDur: selfDur[i],
      name: SpSystemTrace.DATA_DICT.get(name[i]),
    } as unknown);
  }
  return {
    // @ts-ignore
    maxDepth: res.maxDepth,
    dataList: outArr,
  };
}
