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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { getThreadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { IrqStruct } from '../ui-worker/ProcedureWorkerIrq';
import { Utils } from '../../component/trace/base/Utils';

export function irqDataSender(cpu: number, name: string, row: TraceRow<IrqStruct>): Promise<IrqStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      argSetId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.IrqData,
      {
        cpu: cpu,
        name: name,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean) =>
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len))
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): IrqStruct[] {
  let outArr: IrqStruct[] = [];
  // @ts-ignore
  let argSetId = new Int32Array(buffers.argSetId);
  // @ts-ignore
  let depth = new Uint32Array(buffers.depth);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let id = new Uint32Array(buffers.id);
  for (let i = 0; i < len; i++) {
    outArr.push({
      argSetId: argSetId[i],
      depth: depth[i],
      dur: dur[i],
      id: id[i],
      startNS: startNS[i],
    } as unknown as IrqStruct);
  }
  return outArr;
}
