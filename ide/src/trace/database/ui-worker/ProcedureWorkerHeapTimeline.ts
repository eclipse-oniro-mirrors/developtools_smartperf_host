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
import { BaseStruct, Rect, drawLoadingFrame, isFrameContainPoint } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { HeapSample } from '../../../js-heap/model/DatabaseStruct';

export class HeapTimelineRender {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      samples: Array<HeapSample>;
    },
    row: TraceRow<HeapTimelineStruct>
  ): void {
    let list = row.dataListCache;
    let filter: Array<HeapTimelineStruct> = [];
    if (list.length === 0) {
      return;
    }
    HeapTimelineStruct.samples = req.samples;
    HeapTimeline(
      list,
      filter,
      HeapTimelineStruct.samples,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      (TraceRow.range?.endNS ?? 0) - (TraceRow.range?.startNS! ?? 0),
      row.frame
    );
    drawLoadingFrame(req.context, filter, row);
    let heapTimelineFind = false;
    for (let re of filter) {
      HeapTimelineStruct.draw(req.context, re);
      this.setHoverStruct(row, re, heapTimelineFind);
    }
    if (!heapTimelineFind && row.isHover) {
      HeapTimelineStruct.hoverHeapTimelineStruct = undefined;
    }
  }
  setHoverStruct(row: TraceRow<HeapTimelineStruct>, re: HeapTimelineStruct, heapTimelineFind: boolean): void {
    if (row.isHover) {
      if (re.size === 0) {
        if (
          re.frame &&
          row.hoverX >= re.frame.x &&
          row.hoverX <= re.frame.x &&
          row.hoverY >= re.frame.y &&
          row.hoverY <= re.frame.y + re.frame.height
        ) {
          HeapTimelineStruct.hoverHeapTimelineStruct = re;
          heapTimelineFind = true;
        }
      } else {
        if (re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
          HeapTimelineStruct.hoverHeapTimelineStruct = re;
          heapTimelineFind = true;
        }
      }
    }
  }
}
export function HeapTimeline(
  list: Array<HeapTimelineStruct>,
  filter: Array<HeapTimelineStruct>,
  samples: Array<HeapSample>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  let maxSize = 0;
  let index = [];
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].size > 0) {
      maxSize = Math.max(maxSize, samples[i].size);
      index.push(i);
    }
  }
  filter.length = 0;
  for (let i of index) {
    HeapTimelineStruct.setFrame(
      samples[i].timestamp,
      samples[i].size,
      maxSize,
      list[i],
      startNS || 0,
      endNS || 0,
      totalNS || 0,
      frame
    );
  }
  for (let i = 0, len = list.length; i < len; i++) {
    if (list[i].frame) {
      filter.push(list[i]);
    }
  }
}
export class HeapTimelineStruct extends BaseStruct {
  static hoverHeapTimelineStruct: HeapTimelineStruct | undefined;
  static samples: Array<HeapSample>;
  size: number = 0;

  static setFrame(
    timestamp: number,
    size: number,
    maxSize: number,
    node: HeapTimelineStruct,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    node.frame = undefined;
    // us * 1000 = ns
    //@ts-ignore
    if (node.timestamp * 1000 > startNS && node.timestamp * 1000 < endNS && node.timestamp === timestamp) {
      let rectangle: Rect = new Rect(
        Math.floor(((timestamp * 1000 - startNS) / totalNS) * frame.width),
        0,
        2,
        Math.floor((size / maxSize) * frame.height) < 1 ? 1 : Math.floor((size / maxSize) * frame.height)
      );
      node.frame = rectangle;
    }
  }

  static draw(ctx: CanvasRenderingContext2D, node: HeapTimelineStruct): void {
    ctx!.beginPath();
    ctx!.lineWidth = 2;
    ctx!.strokeStyle = '#0A59F7';
    ctx!.moveTo(node.frame!.x, 40);
    ctx!.lineTo(node.frame!.x, 40 - node.frame!.height);
    ctx!.stroke();
    ctx!.closePath();
  }
}
