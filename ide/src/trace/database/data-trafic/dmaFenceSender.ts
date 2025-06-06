// Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { type DmaFenceStruct } from '../ui-worker/ProcedureWorkerDmaFence';
import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';

export function dmaFenceSender(
  dmaFenceInit: String, 
  dmaFenceName: String, 
  row: TraceRow<DmaFenceStruct>
  ): Promise<DmaFenceStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if ((trafic === TraficEnum.SharedArrayBuffer || trafic === TraficEnum.Memory) && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      presentId: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
      QueryEnum.dmaFenceData, 
      {
      dmaFenceInit: dmaFenceInit,
      dmaFenceName: dmaFenceName,
      startNS: TraceRow.range?.startNS || 0,
      endNS: TraceRow.range?.endNS || 0,
      recordStartNS: window.recordStartNS,
      recordEndNS: window.recordEndNS,
      width: width,
      trafic: trafic,
      sharedArrayBuffers: row.sharedArrayBuffers,
    }, 
    (res: unknown, len: number, transfer: boolean): void => {
      resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
    });
  });
}

function arrayBufferHandler(res: unknown, len: number): DmaFenceStruct[] {
  let outArr: DmaFenceStruct[] = [];
  //@ts-ignore
  let startTime = new Float64Array(res.startTime);
  //@ts-ignore
  let dur = new Float64Array(res.dur);
  //@ts-ignore
  let id = new Uint16Array(res.id);
  for (let i = 0; i < len; i++) {
    outArr.push({
      id: id[i],
      dur: dur[i],
      startTime: startTime[i],
    } as unknown as DmaFenceStruct);
  }
  return outArr;
}
