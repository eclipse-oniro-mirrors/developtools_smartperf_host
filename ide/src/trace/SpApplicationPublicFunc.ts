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

import { getThreadPoolTraceBufferCacheKey } from './database/SqlLite';

export enum TraceMode {
  NORMAL,
  LONG_TRACE,
  DISTRIBUTED,
}

export const applicationHtml: string = `
        <style>
        :host{

        }
        .dark{
        --dark-background: #272C34;
        --dark-background1: #424851;
        --dark-background2: #262f3c;
        --dark-background3: #292D33;
        --dark-background4: #323841;
        --dark-background5: #333840;
        --dark-background6: rgba(82,145,255,0.2);
        --dark-background7: #494d52;
        --dark-background8: #5291FF;
        --dark-color: rgba(255,255,255,0.6);
        --dark-color1: rgba(255,255,255,0.86);
        --dark-color2: rgba(255,255,255,0.9);
        --dark-border: #474F59;
        --dark-color3:#4694C2;
        --dark-color4:#5AADA0;
        --dark-border1: #454E5A;
        --bark-expansion:#0076FF;
        --bark-prompt:#9e9e9e;
        --dark-icon:#adafb3;
        --dark-img: url('img/dark_pic.png');
            background: #272C34;
            color: #FFFFFF;
        }
        .root{
            display: grid;
            grid-template-rows: min-content 1fr;
            grid-template-columns: min-content 1fr;
            grid-template-areas: 'm s'
                                 'm b';
            height: 100vh;
            width: 100vw;
        }
        .filedrag::after {
             content: 'Drop the trace file to open it';
             position: fixed;
             z-index: 2001;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             border: 5px dashed var(--dark-color1,#404854);
             text-align: center;
             font-size: 3rem;
             line-height: 100vh;
             background: rgba(255, 255, 255, 0.5);
        }
        .menu{
            grid-area: m;
            /*transition: all 0.2s;*/
            box-shadow: 4px 0px 20px rgba(0,0,0,0.05);
            z-index: 2000;
        }
        .search-vessel{
            z-index: 999;
            position: relative;
            cursor: default;
        }
        .progress{
            bottom: 0;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }

        :host(:not([search])) .search-vessel  {
           display: none;
        }
        :host(:not([search])) .search-vessel .search  {
            background-color: var(--dark-background5,#F6F6F6);
        }
        .search{
            grid-area: s;
            background-color: var(--dark-background,#FFFFFF);
            height: 48px;
            display: flex;
            justify-content: center;
            align-items: center;

        }
        .search .search-bg{
            background-color: var(--dark-background5,#fff);
            border-radius: 40px;
            padding: 3px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid var(--dark-border,#c5c5c5);
        }
        lit-search input{
            outline: none;
            border: 0px;
            background-color: transparent;
            font-size: inherit;
            color: var(--dark-color,#666666);
            width: 30vw;
            height: auto;
            vertical-align:middle;
            line-height:inherit;
            height:inherit;
            padding: 6px 6px 6px 6px};
            max-height: inherit;
            box-sizing: border-box;

        }
        ::placeholder { /* CSS 3 標準 */
          color: #b5b7ba;
          font-size: 1em;
        }
        lit-search input::placeholder {
          color: #b5b7ba;
          font-size: 1em;
        }
        .content{
            grid-area: b;
            background-color: #ffffff;
            height: 100%;
            overflow: auto;
            position:relative;
        }
        .sheet{

        }
        .sidebar-button{
            position: absolute;
            top: 0;
            left: 0;
            background-color: var(--dark-background1,#FFFFFF);
            height: 100%;
            border-radius: 0 5px 5px 0;
            width: 48px;
            display: flex;
            align-content: center;
            justify-content: center;
            cursor: pointer;
        }
        :host{
            font-size: inherit;
            display: inline-block;
            transition: .3s;
         }
         :host([spin]){
            animation: rotate 1.75s linear infinite;
         }
         @keyframes rotate {
            to{
                transform: rotate(360deg);
            }
         }
         .icon{
            display: block;
            width: 1em;
            height: 1em;
            margin: auto;
            fill: currentColor;
            overflow: hidden;
            font-size: 20px;
            color: #1E4EEA;
         }
        :host([chart_filter]) .chart-filter {
            display: grid;
            grid-template-rows: min-content min-content min-content max-content auto;
            overflow-y: clip;
            height: 99%;
            visibility: visible;
            position: absolute;
            width: 40%;
            right: 0;
            z-index: 1001;
            top: 0;
        }
        :host([custom-color]) .custom-color {
            display: grid;
            grid-template-rows: min-content min-content min-content max-content auto;
            overflow-y: auto;
            height: 100%;
            visibility: visible;
            position: absolute;
            width: 50%;
            right: 0;
            z-index: 1002;
            top: 0;
        }
        .filter-config {
            opacity: 1;
            visibility: hidden;
        }
        .filter-config:hover {
            opacity: 0.7;
        }
        .page-button[prohibit] {
          cursor: none;
        }
        .page-button {
            background: #D8D8D8;
            border-radius: 12px;
            width: 24px;
            height: 24px;
            margin-right: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #preview-button:hover {
          cursor: pointer;
          background: #0A59F7;
          color: #FFFFFF;
          opacity: 1;
        }
        #next-button:hover {
          cursor: pointer;
          background: #0A59F7;
          color: #FFFFFF;
          opacity: 1;
        }
        .pagination:hover {
          cursor: pointer;
          background: #0A59F7;
          color: #FFFFFF;
          opacity: 1;
        }
        .confirm-button:hover {
          cursor: pointer;
          background: #0A59F7;
          color: #FFFFFF;
          opacity: 1;
        }
        .pagination {
            background: #D8D8D8;
            color: #000000;
            border-radius: 12px;
            width: 24px;
            height: 24px;
            margin-right: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: Helvetica;
            font-size: 12px;
            text-align: center;
            line-height: 20px;
            font-weight: 400;
            opacity: 0.6;
        }
        .pagination[selected] {
            background: #0A59F7;
            color: #FFFFFF;
            opacity: 1;
        }
        .page-jump-font {
            opacity: 0.6;
            font-family: Helvetica;
            font-size: 12px;
            color: #000000;
            text-align: center;
            line-height: 20px;
            font-weight: 400;
        }
        .page-input {
            background: #D8D8D8;
            border-radius: 10px;
            width: 40px;
            height: 24px;
            justify-content: center;
            align-items: center;
            text-align: center;
            margin-right: 8px;
            border: none;
        }
        .confirm-button {
            font-family: Helvetica;
            font-size: 12px;
            color: #0A59F7;
            text-align: center;
            font-weight: 400;
            border: 1px solid #0A59F7;
            border-radius: 10px;
            width: 64px;
            height: 24px;
            line-height: 24px;
        }
        .long_trace_page {
            justify-content: center;
            width: -webkit-fill-available;
            margin-right: 5.2em;
            align-items: center;
            display: none;
        }
        .content-center-option {
          justify-content: center;
          width: -webkit-fill-available;
          margin-right: 5.2em;
          align-items: center;
          width: auto;
        }
        .page-number-list {
            display: flex;
        }

        #sp-ai-analysis {
            top:75px;
            right:0px;
            position:absolute;
            z-index:9999;
            min-width:430px;
            max-width:75%;
            width:430px;
            height:740px;
            box-shadow:3px 0px 14px #000;
            border-radius:8px;
            background-color:#fff;
            padding:10px 10px 30px 5px;
            box-sizing:border-box;
            visibility:hidden;
        }
        #sp-snapshot-view {
            top:75px;
            right:0px;
            position:absolute;
            z-index:2000;
            width:25%;
            height:90%;
            box-shadow:3px 0px 14px #000;
            background-color:#fff;
            box-sizing:border-box;
            visibility:hidden;
        }
        </style>
        <div class="root" style="position: relative;">
            <sp-bubble-ai style="visibility: visible; top:50%;right:2px;position: absolute;z-index: 10000" id="sp-bubbles" draggable ="true"></sp-bubble-ai>
            <sp-advertisement style="bottom:2px;right:2px;position: absolute;z-index: 10086" id= "sp-advertisement"></sp-advertisement>
            <lit-main-menu id="main-menu" class="menu" data=''></lit-main-menu>
            <sp-keyboard style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0px;left:0px;right:0;bottom:0px;position:absolute;z-index: 8888" id="sp-keyboard">
            </sp-keyboard>
            <div class="search-vessel">
                <div class="search" style="position: relative;">
                    <div class="sidebar-button" style="width: 0">
                        <svg class="icon" id="icon" aria-hidden="true" viewBox="0 0 1024 1024">
                             <use id="use" xlink:href="./base-ui/icon.svg#icon-menu"></use>
                        </svg>
                    </div>
                    <div class = "content-left-option" style="text-align: left;
                      position: absolute;left: 5px ; cursor: pointer;top: 15px">
                      <div title="Import Key Path" id="import-key-path" style="display: none ;text-align: left;cursor: pointer;">
                        <input id="import-config" style="display: none;pointer-events: none" type="file" accept=".json" >
                        <label style="width: 20px;height: 20px;cursor: pointer;" for="import-config">
                            <lit-icon id="import-btn" name="copy-csv" style="pointer-events: none" size="20">
                            </lit-icon>
                        </label>
                      </div>
                      <lit-icon  id="close-key-path" name="close" title="Close Key Path" color='#fff' size="20" style="display: none;text-align: left;cursor: pointer;">
                      </lit-icon>
                    </div>
                    <lit-search id="lit-search"></lit-search>
                    <lit-search id="lit-record-search"></lit-search>
                    <div class="content-center-option" style="display: ">
                      <div class="long_trace_page" style="display: none;">
                        <div class="page-button" id="preview-button">
                          <img title="preview" src="img/preview.png"/>
                        </div>
                        <div class="page-number-list"></div>
                        <div class="page-button" id="next-button" style="margin-right: 8px;">
                           <img title="next" src="img/next.png"/>
                        </div>
                        <div class="page-jump-font" style="margin-right: 8px;">To</div>
                        <input class="page-input" />
                        <div class="confirm-button">Confirm</div>
                      </div>
                    </div>
                </div>
                <div class = "content-right-option" style="display: flex;flex-flow: nowrap;text-align: right;position: absolute;right: 1.2em;cursor: pointer;top: 17px"">
                  <lit-icon class="export-record" title="Download Mark Trace" name="download" size="16" style="margin-left: 0.8em;"></lit-icon>
                  <img class="cut-trace-file" title="Cut Trace File" src="img/menu-cut.svg" style="margin-left: 0.8em;">
                  <img class="filter-config" title="Display Template" src="img/config_filter.png" style="margin-left: 0.8em;">
                </div>
                <lit-progress-bar class="progress"></lit-progress-bar>
            </div>
            <div id="app-content" class="content">
                <sp-welcome style="visibility:visible;top:0px;left:0px;position:absolute;z-index: 100" id="sp-welcome">
                </sp-welcome>
                </sp-ai-analysis>
                <sp-system-trace style="visibility:hidden;z-index: 101;" id="sp-system-trace">
                </sp-system-trace>
                <sp-record-trace record_template='false' style="overflow:auto;width:100%;height:100%;visibility:hidden;top:0px;left:0px;right:0;bottom:0px;position:absolute;z-index: 102" id="sp-record-trace">
                </sp-record-trace>
                <sp-scheduling-analysis style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0;left:0;right:0;bottom:0;position:absolute;" id="sp-scheduling-analysis"></sp-scheduling-analysis>
                <sp-metrics style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0;left:0;right:0;bottom:0;position:absolute;z-index: 105" id="sp-metrics">
                </sp-metrics>
                <sp-query-sql style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0;left:0;right:0;bottom:0;position:absolute;z-index: 106" id="sp-query-sql">
                </sp-query-sql>
                <sp-info-and-stats style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0;left:0;right:0;bottom:0;position:absolute;z-index: 107" id="sp-info-and-stats">
                </sp-info-and-stats>
                <sp-convert-trace style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0;left:0;right:0;bottom:0;position:absolute;z-index: 107" id="sp-convert-trace">
                </sp-convert-trace>
                <sp-help style="width:100%;height:100%;overflow:hidden;visibility:hidden;top:0px;left:0px;right:0;bottom:0px;position:absolute;z-index: 103" id="sp-help">
                </sp-help>
                <sp-flags style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0px;left:0px;right:0;bottom:0px;position:absolute;z-index: 104" id="sp-flags">
                </sp-flags>
                <sp-third-party style="width:100%;height:100%;overflow:auto;visibility:hidden;top:0px;left:0px;right:0;bottom:0px;position:absolute;z-index: 104" id="sp-third-party">
                </sp-third-party>
                <trace-row-config class="chart-filter" style="height:100%;top:0px;right:0;bottom:0px;position:absolute;z-index: 1001"></trace-row-config>
                <custom-theme-color class="custom-color" style="height:100%;top:0px;right:0;bottom:0px;position:absolute;z-index: 1001"></custom-theme-color>
            </div>
                <sp-ai-analysis id="sp-ai-analysis" style="visibility:hidden;"></sp-ai-analysis>
                <sp-snapshot-view id="sp-snapshot-view" style="visibility:hidden;"></sp-snapshot-view>
        </div>
        `;

export function readTraceFileBuffer(): Promise<ArrayBuffer | undefined> {
  return new Promise((resolve) => {
    caches.match(getThreadPoolTraceBufferCacheKey('1')).then((res) => {
      if (res) {
        res.arrayBuffer().then((buffer) => {
          resolve(buffer);
        });
      } else {
        resolve(undefined);
      }
    });
  });
}

export function clearTraceFileCache(): void {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key === getThreadPoolTraceBufferCacheKey('1')) {
        caches.delete(key).then();
      } else if (key.includes('/') && key.includes('-')) {
        let splits = key.split('/');
        let keyStr = splits[splits.length - 1];
        let time = keyStr.split('-')[0];
        let fileDate = new Date(parseInt(time));
        if (fileDate.toLocaleDateString() !== new Date().toLocaleDateString()) {
          //如果不是当天的缓存则删去缓存文件
          caches.delete(key).then();
        }
      } else {
        caches.delete(key).then();
      }
    });
  });
}

export function postLog(filename: string, fileSize: string): void {
  fetch(`https://${window.location.host.split(':')[0]}:${window.location.port}/logger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: filename,
      fileSize: fileSize,
    }),
  })
    .then((response) => response.json())
    .then((data) => { })
    .catch((error) => { });
}

export function indexedDataToBufferData(sourceData: unknown): ArrayBuffer {
  let uintArrayLength = 0;
  //@ts-ignore
  let uintDataList = sourceData.map((item: unknown) => {
    //@ts-ignore
    let currentBufData = new Uint8Array(item.buf);
    uintArrayLength += currentBufData.length;
    return currentBufData;
  });
  let resultArrayBuffer = new ArrayBuffer(uintArrayLength);
  let resultUintArray = new Uint8Array(resultArrayBuffer);
  let offset = 0;
  uintDataList.forEach((currentArray: Uint8Array) => {
    resultUintArray.set(currentArray, offset);
    offset += currentArray.length;
  });
  return resultArrayBuffer;
}

export function findFreeSizeAlgorithm(numbers: Array<number>, freeSize: number): Array<number> {
  let closestSize = 0;
  let currentSize = 0;
  let finalIndex: Array<number> = [];
  let currentSelectIndex: Array<number> = [];

  function reBackFind(index: number): void {
    if (index === numbers.length) {
      const sumDifference = Math.abs(currentSize - freeSize);
      if (currentSize <= freeSize && sumDifference < Math.abs(closestSize - freeSize)) {
        closestSize = currentSize;
        finalIndex = [...currentSelectIndex];
      }
      return;
    }
    currentSize += numbers[index];
    currentSelectIndex.push(index);
    reBackFind(index + 1);
    currentSize -= numbers[index];
    currentSelectIndex.pop();
    reBackFind(index + 1);
  }

  reBackFind(0);
  return finalIndex;
}

export function getCurrentDataTime(): string[] {
  let current = new Date();
  let year = '' + current.getFullYear();
  let month = ('0' + (current.getMonth() + 1)).slice(-2);
  let day = ('0' + current.getDate()).slice(-2);
  let hours = ('0' + current.getHours()).slice(-2);
  let minutes = ('0' + current.getMinutes()).slice(-2);
  let seconds = ('0' + current.getSeconds()).slice(-2);
  return [year, month, day, hours, minutes, seconds];
}

// 定义ZIP文件的文件头常量
const ZIP_HEADER = [0x50, 0x4B, 0x03, 0x04];
// 定义ZLIB文件的文件头常量
const ZLIB_HEADER = [0x78, 0x9c];

/**
 * 验证Uint8Array实例并检查长度是否满足要求
 * @param uint8Array 待验证的Uint8Array实例
 * @param requiredLength 所需的最小长度
 * @returns 如果uint8Array是一个Uint8Array实例且长度大于等于requiredLength，则返回true，否则返回false
 */
function validateUint8Array(uint8Array: Uint8Array, requiredLength: number): boolean {
  return uint8Array instanceof Uint8Array && uint8Array.length >= requiredLength;
}

/**
 * 检查Uint8Array是否表示一个ZIP文件
 * @param uint8Array 待检查的Uint8Array实例
 * @returns 如果uint8Array表示的是一个ZIP文件，则返回true，否则返回false
 */
export function isZipFile(uint8Array: Uint8Array): boolean {
  if (!validateUint8Array(uint8Array, ZIP_HEADER.length)) {
    return false;
  }
  for (let i = 0; i < ZIP_HEADER.length; i++) {
    if (uint8Array[i] !== ZIP_HEADER[i]) {
      return false;
    }
  }
  return true;
}

/**
 * 检查Uint8Array是否表示一个ZLIB文件
 * @param uint8Array 待检查的Uint8Array实例
 * @returns 如果uint8Array表示的是一个ZLIB文件，则返回true，否则返回false
 */
export function isZlibFile(uint8Array: Uint8Array): boolean {
  if (!validateUint8Array(uint8Array, ZLIB_HEADER.length)) {
    return false;
  }
  for (let i = 0; i < ZLIB_HEADER.length; i++) {
    if (uint8Array[i] !== ZLIB_HEADER[i]) {
      return false;
    }
  }
  return true;
}