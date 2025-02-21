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

importScripts('trace_streamer_builtin.js');
import { execProtoForWorker } from './data-trafic/utils/ExecProtoForWorker';
import { QueryEnum, TraficEnum } from './data-trafic/utils/QueryEnum';
import { temp_init_sql_list } from './TempSql';
// @ts-ignore
import { BatchSphData } from '../proto/SphBaseData';

let Module: any = null;
let enc = new TextEncoder();
let dec = new TextDecoder();
let arr: Uint8Array | undefined;
let start: number;
const REQ_BUF_SIZE = 4 * 1024 * 1024;
let reqBufferAddr: number = -1;
let bufferSlice: Array<any> = [];
let json: string;

let headUnitArray: Uint8Array | undefined;
let thirdWasmMap = new Map();
let thirdJsonResult = new Map();

let CONTENT_TYPE_CMDLINES = 2;
let CONTENT_TYPE_TGIDS = 3;

let arkTsData: Array<Uint8Array> = [];
let arkTsDataSize: number = 0;

let currentAction: string = '';
let currentActionId: string = '';
let ffrtFileCacheKey = '-1';

let protoDataMap: Map<QueryEnum, any> = new Map<QueryEnum, any>();
function clear() {
  if (Module != null) {
    Module._TraceStreamerReset();
    Module = null;
  }
  if (arr) {
    arr = undefined;
  }
  if (headUnitArray) {
    headUnitArray = undefined;
  }
  if (bufferSlice) {
    bufferSlice.length = 0;
  }
  thirdWasmMap.clear();
  thirdJsonResult.clear();
}

self.addEventListener('unhandledrejection', (err) => {
  self.postMessage({
    id: currentActionId,
    action: currentAction,
    init: false,
    status: false,
    msg: err.reason.message,
  });
});

function initWASM() {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    let wasm = trace_streamer_builtin_wasm;
    Module = wasm({
      locateFile: (s: any) => {
        return s;
      },
      print: (line: any) => {},
      printErr: (line: any) => {},
      onRuntimeInitialized: () => {
        resolve('ok');
      },
      onAbort: () => {
        reject('on abort');
      },
    });
  });
}

function initThirdWASM(wasmFunctionName: string) {
  function callModelFun(functionName: string) {
    let func = eval(functionName);
    return new func({
      locateFile: (s: any) => {
        return s;
      },
      print: (line: any) => {},
      printErr: (line: any) => {},
      onRuntimeInitialized: () => {},
      onAbort: () => {},
    });
  }

  return callModelFun(wasmFunctionName);
}

let merged = () => {
  let length = 0;
  bufferSlice.forEach((item) => {
    length += item.length;
  });
  let mergedArray = new Uint8Array(length);
  let offset = 0;
  bufferSlice.forEach((item) => {
    mergedArray.set(item, offset);
    offset += item.length;
  });
  return mergedArray;
};

let translateJsonString = (str: string): string => {
  return str //   .padding
    .replace(/[\t|\r|\n]/g, '');
};

let convertJSON = () => {
  try {
    let str = dec.decode(arr);
    let jsonArray: Array<any> = [];
    str = str.substring(str.indexOf('\n') + 1);
    if (!str) {
    } else {
      let parse;
      let tansStr: string;
      try {
        tansStr = str.replace(/[\t\r\n]/g, '');
        parse = JSON.parse(tansStr);
      } catch {
        try {
          tansStr = tansStr!.replace(/[^\x20-\x7E]/g, '?'); //匹配乱码字 符，将其转换为？
          parse = JSON.parse(tansStr);
        } catch {
          tansStr = tansStr!.replace(/\\/g, '\\\\');
          parse = JSON.parse(tansStr);
        }
      }
      let columns = parse.columns;
      let values = parse.values;
      for (let i = 0; i < values.length; i++) {
        let obj: any = {};
        for (let j = 0; j < columns.length; j++) {
          obj[columns[j]] = values[i][j];
        }
        jsonArray.push(obj);
      }
    }
    return jsonArray;
  } catch (e) {
    self.postMessage({
      id: currentActionId,
      action: currentAction,
      init: false,
      status: false,
      msg: (e as any).message,
    });
    return [];
  }
};

/**
 * 计算预留缓存空间，如果空间不够，则删除部分缓存
 * @param size
 */
function saveTraceFileBuffer(key: string, buffer: ArrayBuffer): void {
  obligateFileBufferSpace(buffer.byteLength).then(() => {
    caches.open(key).then((cache) => {
      let headers = new Headers();
      headers.append('Content-Length', `${buffer.byteLength}`);
      headers.append('Content-Type', 'application/octet-stream');
      cache
        .put(
          key,
          new Response(buffer, {
            status: 200,
            headers: headers,
          })
        )
        .then();
    });
  });
}

async function obligateFileBufferSpace(size: number): Promise<void> {
  let es = await navigator.storage.estimate();
  let remainderByte = (es.quota || 0) - (es.usage || 0) - 20 * 1024 * 1024;
  if (remainderByte < size) {
    let keys = await caches.keys();
    keys.sort((keyA, keyB) => {
      if (keyA.includes('/') && keyB.includes('/')) {
        let splitA = keyA.split('/');
        let splitB = keyB.split('/');
        let timeA = splitA[splitA.length - 1].split('-')[0];
        let timeB = splitB[splitB.length - 1].split('-')[0];
        return parseInt(timeA) - parseInt(timeB);
      } else {
        return 0;
      }
    });
    let needSize = size - remainderByte;
    for (let key of keys) {
      await caches.delete(key);
      let keySize = parseInt(key.split('-')[1]);
      if (keySize > needSize) {
        return;
      } else {
        needSize -= keySize;
      }
    }
  }
}

self.onmessage = async (e: MessageEvent) => {
  currentAction = e.data.action;
  currentActionId = e.data.id;
  let typeLength = 4;
  if (e.data.action === 'reset') {
    clear();
  } else if (e.data.action === 'open') {
    await initWASM();
    ffrtFileCacheKey = '-1';
    // @ts-ignore
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      ready: true,
      index: 0,
    });
    let uint8Array = new Uint8Array(e.data.buffer);
    let callback = (heapPtr: number, size: number, isEnd: number) => {
      let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
      bufferSlice.push(out);
      if (isEnd == 1) {
        arr = merged();
        bufferSlice.length = 0;
      }
    };
    let fn = Module.addFunction(callback, 'viii');
    reqBufferAddr = Module._Initialize(fn, REQ_BUF_SIZE);
    let ffrtConvertCallback = (heapPtr: number, size: number, isEnd: number) => {
      if (isEnd !== 1) {
        let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
        bufferSlice.push(out);
      } else {
        arr = merged();
        bufferSlice.length = 0;
        ffrtFileCacheKey = `ffrt/${new Date().getTime()}-${arr.buffer.byteLength}`;
        saveTraceFileBuffer(ffrtFileCacheKey, arr.buffer);
      }
    };
    let tlvResultCallback = (heapPtr: number, size: number, type: number, isEnd: number) => {
      let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
      protoDataMap.set(type, BatchSphData.decode(out).values);
    };
    let fn1 = Module.addFunction(callback, 'viii');
    let fn2 = Module.addFunction(ffrtConvertCallback, 'viii');
    let tlvResultFun = Module.addFunction(tlvResultCallback, 'viiii');
    Module._TraceStreamer_Set_Log_Level(5);
    reqBufferAddr = Module._Initialize(REQ_BUF_SIZE, fn1, tlvResultFun, fn2);
    let parseConfig = e.data.parseConfig;
    if (parseConfig !== '') {
      let parseConfigArray = enc.encode(parseConfig);
      let parseConfigAddr = Module._InitializeParseConfig(1024);
      Module.HEAPU8.set(parseConfigArray, parseConfigAddr);
      Module._TraceStreamerParserConfigEx(parseConfigArray.length);
    }
    let wasmConfigStr = e.data.wasmConfig;
    if (wasmConfigStr != '' && wasmConfigStr.indexOf('WasmFiles') != -1) {
      let wasmConfig = JSON.parse(wasmConfigStr);
      let wasmConfigs = wasmConfig.WasmFiles;
      let itemArray = wasmConfigs.map((item: any) => {
        return item.componentId + ';' + item.pluginName;
      });
      let thirdWasmStr: string = itemArray.join(';');
      let configUintArray = enc.encode(thirdWasmStr + ';');
      Module.HEAPU8.set(configUintArray, reqBufferAddr);
      Module._TraceStreamer_Init_ThirdParty_Config(configUintArray.length);
      let first = true;
      let sendDataCallback = (heapPtr: number, size: number, componentID: number) => {
        if (componentID === 100) {
          if (first) {
            first = false;
            headUnitArray = Module.HEAPU8.slice(heapPtr, heapPtr + size);
          }
          return;
        }
        let configs = wasmConfigs.filter((wasmConfig: any) => {
          return wasmConfig.componentId == componentID;
        });
        if (configs.length > 0) {
          let config = configs[0];
          let model = thirdWasmMap.get(componentID);
          if (!model && config.componentId === componentID) {
            importScripts(config.wasmJsName);
            setThirdWasmMap(config, heapPtr, size, componentID);
          } else {
            let mm = model.model;
            let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
            mm.HEAPU8.set(out, model.bufferAddr);
            mm._ParserData(out.length, componentID);
          }
        }
      };
      let fn1 = Module.addFunction(sendDataCallback, 'viii');
      let reqBufferAddr1 = Module._TraceStreamer_Set_ThirdParty_DataDealer(fn1, REQ_BUF_SIZE);
    }
    function initTraceRange(thirdMode: any): any {
      let updateTraceTimeCallBack = (heapPtr: number, size: number) => {
        let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
        Module.HEAPU8.set(out, reqBufferAddr);
        Module._UpdateTraceTime(out.length);
      };
      let traceRangeFn = thirdMode.addFunction(updateTraceTimeCallBack, 'vii');
      let mm = thirdMode._InitTraceRange(traceRangeFn, 1024);
      return mm;
    }
    function setThirdWasmMap(config: any, heapPtr: number, size: number, componentID: number) {
      let thirdMode = initThirdWASM(config.wasmName);
      let configPluginName = config.pluginName;
      let pluginNameUintArray = enc.encode(configPluginName);
      let pluginNameBuffer = thirdMode._InitPluginName(pluginNameUintArray.length);
      thirdMode.HEAPU8.set(pluginNameUintArray, pluginNameBuffer);
      thirdMode._TraceStreamerGetPluginNameEx(configPluginName.length);
      let thirdQueryDataCallBack = (heapPtr: number, size: number, isEnd: number, isConfig: number) => {
        if (isConfig == 1) {
          let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
          thirdJsonResult.set(componentID, {
            jsonConfig: dec.decode(out),
            disPlayName: config.disPlayName,
            pluginName: config.pluginName,
          });
        } else {
          let out: Uint8Array = thirdMode.HEAPU8.slice(heapPtr, heapPtr + size);
          bufferSlice.push(out);
          if (isEnd == 1) {
            arr = merged();
            bufferSlice.length = 0;
          }
        }
      };
      let fn = thirdMode.addFunction(thirdQueryDataCallBack, 'viiii');
      let thirdreqBufferAddr = thirdMode._Init(fn, REQ_BUF_SIZE);
      let mm = initTraceRange(thirdMode);
      thirdMode._TraceStreamer_In_JsonConfig();
      thirdMode.HEAPU8.set(headUnitArray, thirdreqBufferAddr);
      thirdMode._ParserData(headUnitArray!.length, 100);
      let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
      thirdMode.HEAPU8.set(out, thirdreqBufferAddr);
      thirdMode._ParserData(out.length, componentID);
      thirdWasmMap.set(componentID, {
        model: thirdMode,
        bufferAddr: thirdreqBufferAddr,
      });
    }
    let wrSize = 0;
    let r2 = -1;
    let rowTraceStr = Array.from(new Uint16Array(e.data.buffer.slice(0, 2)));
    if (rowTraceStr[0] === 57161) {
      let commonDataOffsetList: Array<{
        startOffset: number;
        endOffset: number;
      }> = [];
      let offset = 12;
      let tlvTypeLength = 4;
      let headArray = uint8Array.slice(0, offset);
      let commonTotalLength = 0;
      while (offset < uint8Array.length) {
        let commonDataOffset = {
          startOffset: offset,
          endOffset: offset,
        };
        let dataTypeData = e.data.buffer.slice(offset, offset + tlvTypeLength);
        offset += tlvTypeLength;
        let dataType = Array.from(new Uint32Array(dataTypeData));
        let currentLData = e.data.buffer.slice(offset, offset + tlvTypeLength);
        offset += tlvTypeLength;
        let currentVLength = Array.from(new Uint32Array(currentLData));
        offset += currentVLength[0];
        commonDataOffset.endOffset = offset;
        if (dataType[0] === CONTENT_TYPE_CMDLINES || dataType[0] === CONTENT_TYPE_TGIDS) {
          commonTotalLength += commonDataOffset.endOffset - commonDataOffset.startOffset;
          commonDataOffsetList.push(commonDataOffset);
        }
      }
      let frontData = new Uint8Array(headArray.byteLength + commonTotalLength);
      // HeadArray
      frontData.set(headArray, 0);
      let lengthOffset = headArray.byteLength;
      // common Data
      commonDataOffsetList.forEach((item) => {
        let commonData = uint8Array.slice(item.startOffset, item.endOffset);
        frontData.set(commonData, lengthOffset);
        lengthOffset += commonData.byteLength;
      });
      let freeData = uint8Array.slice(12);
      let final = new Uint8Array(frontData.length + freeData.length);
      final.set(frontData);
      final.set(freeData, frontData.length);
      wrSize = 0;
      while (wrSize < final.length) {
        const sliceLen = Math.min(final.length - wrSize, REQ_BUF_SIZE);
        const dataSlice = final.subarray(wrSize, wrSize + sliceLen);
        Module.HEAPU8.set(dataSlice, reqBufferAddr);
        wrSize += sliceLen;
        r2 = Module._TraceStreamerParseDataEx(sliceLen, wrSize === final.length ? 1 : 0);
        if (r2 === -1) {
          break;
        }
      }
    } else {
      while (wrSize < uint8Array.length) {
        const sliceLen = Math.min(uint8Array.length - wrSize, REQ_BUF_SIZE);
        const dataSlice = uint8Array.subarray(wrSize, wrSize + sliceLen);
        Module.HEAPU8.set(dataSlice, reqBufferAddr);
        wrSize += sliceLen;
        r2 = Module._TraceStreamerParseDataEx(sliceLen, wrSize === uint8Array.length ? 1 : 0);
        if (r2 == -1) {
          break;
        }
      }
    }
    Module._TraceStreamerParseDataOver();
    for (let value of thirdWasmMap.values()) {
      value.model._TraceStreamer_In_ParseDataOver();
    }
    if (r2 == -1) {
      // @ts-ignore
      self.postMessage({
        id: e.data.id,
        action: e.data.action,
        init: false,
        msg: 'parse data error',
      });
      return;
    }
    temp_init_sql_list.forEach((item, index) => {
      let r = createView(item);
      // @ts-ignore
      self.postMessage({ id: e.data.id, ready: true, index: index + 1 });
    });
    self.postMessage(
      {
        id: e.data.id,
        action: e.data.action,
        init: true,
        msg: 'ok',
        configSqlMap: thirdJsonResult,
        buffer: e.data.buffer,
        fileKey: ffrtFileCacheKey,
      },
      // @ts-ignore
      [e.data.buffer]
    );
  } else if (e.data.action === 'exec') {
    query(e.data.name, e.data.sql, e.data.params);
    let jsonArray = convertJSON();
    // @ts-ignore
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      results: jsonArray,
    });
  } else if (e.data.action === 'exec-proto') {
    execProtoForWorker(e.data, (sql: string) => {
      let sqlUintArray = enc.encode(sql);
      if (e.data.params.trafic !== TraficEnum.ProtoBuffer) {
        Module.HEAPU8.set(sqlUintArray, reqBufferAddr);
        Module._TraceStreamerSqlQueryEx(sqlUintArray.length);
        let jsonArray = convertJSON();
        return jsonArray;
      } else {
        let allArray = new Uint8Array(typeLength + sqlUintArray.length);
        allArray[0] = e.data.name;
        allArray.set(sqlUintArray, typeLength);
        Module.HEAPU8.set(allArray, reqBufferAddr);
        Module._TraceStreamerSqlQueryToProtoCallback(allArray.length);
        let finalArrayBuffer = [];
        if (protoDataMap.has(e.data.name)) {
          finalArrayBuffer = protoDataMap.get(e.data.name);
          protoDataMap.delete(e.data.name);
        }
        return finalArrayBuffer;
      }
    });
  } else if (e.data.action == 'exec-buf') {
    query(e.data.name, e.data.sql, e.data.params);
    self.postMessage(
      { id: e.data.id, action: e.data.action, results: arr!.buffer },
      // @ts-ignore
      [arr.buffer]
    );
  } else if (e.data.action.startsWith('exec-sdk')) {
    querySdk(e.data.name, e.data.sql, e.data.params, e.data.action);
    let jsonArray = convertJSON();
    // @ts-ignore
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      results: jsonArray,
    });
  } else if (e.data.action.startsWith('exec-metric')) {
    queryMetric(e.data.sql);
    let metricResult = dec.decode(arr);
    // @ts-ignore
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      results: metricResult,
    });
  } else if (e.data.action == 'init-port') {
    let port = e.ports[0];
    port.onmessage = (me) => {
      query(me.data.action, me.data.sql, me.data.params);
      let msg = {
        id: me.data.id,
        action: me.data.action,
        results: arr!.buffer,
      };
      port.postMessage(msg, [arr!.buffer]);
    };
  } else if (e.data.action == 'download-db') {
    let bufferSliceUint: Array<any> = [];
    let mergedUint = () => {
      let length = 0;
      bufferSliceUint.forEach((item) => {
        length += item.length;
      });
      let mergedArray = new Uint8Array(length);
      let offset = 0;
      bufferSliceUint.forEach((item) => {
        mergedArray.set(item, offset);
        offset += item.length;
      });
      return mergedArray;
    };
    let getDownloadDb = (heapPtr: number, size: number, isEnd: number) => {
      let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
      bufferSliceUint.push(out);
      if (isEnd == 1) {
        let arr: Uint8Array = mergedUint();
        self.postMessage({
          id: e.data.id,
          action: e.data.action,
          results: arr,
        });
      }
    };
    let fn1 = Module.addFunction(getDownloadDb, 'viii');
    Module._WasmExportDatabase(fn1);
  } else if (e.data.action === 'upload-so') {
    uploadSoActionId = e.data.id;
    let fileList = e.data.params as Array<File>;
    if (fileList) {
      soFileList = fileList;
      uploadFileIndex = 0;
      if (!uploadSoCallbackFn) {
        uploadSoCallbackFn = Module.addFunction(uploadSoCallBack, 'viii');
      }
      uploadSoFile(soFileList[uploadFileIndex]).then();
    }
  } else if (e.data.action === 'cut-file') {
    cutFileByRange(e);
  } else if (e.data.action === 'long_trace') {
    await initWASM();
    let result = {};
    let headArray = e.data.params.headArray;
    let timStamp = e.data.params.timeStamp;
    let allIndexDataList = e.data.params.splitDataList;
    let splitFileInfos = e.data.params.splitFileInfo as Array<{
      fileType: string;
      startIndex: number;
      endIndex: number;
      size: number;
    }>;
    let maxSize = 48 * 1024 * 1024;
    let maxPageNum = headArray.length / 1024;
    let currentPageNum = 0;
    let splitReqBufferAddr: number;
    if (splitFileInfos) {
      let splitFileInfo = splitFileInfos.filter((splitFileInfo) => splitFileInfo.fileType !== 'trace');
      if (splitFileInfo && splitFileInfo.length > 0) {
        let traceFileType: string = '';
        let db = await openDB();
        let newCutFilePageInfo: Map<
          string,
          {
            traceFileType: string;
            dataArray: [{ data: Uint8Array | Array<{ offset: number; size: number }>; dataTypes: string }];
          }
        > = new Map();
        let cutFileCallBack = (heapPtr: number, size: number, dataType: number, isEnd: number) => {
          let key = `${traceFileType}_${currentPageNum}`;
          let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
          if (DataTypeEnum.data === dataType) {
            if (traceFileType === 'arkts') {
              arkTsData.push(out);
              arkTsDataSize += size;
            } else {
              if (newCutFilePageInfo.has(key)) {
                let newVar = newCutFilePageInfo.get(key);
                newVar?.dataArray.push({ data: out, dataTypes: 'data' });
              } else {
                newCutFilePageInfo.set(key, {
                  traceFileType: traceFileType,
                  dataArray: [{ data: out, dataTypes: 'data' }],
                });
              }
            }
          } else if (DataTypeEnum.json === dataType) {
            let cutFilePageInfo = newCutFilePageInfo.get(key);
            if (cutFilePageInfo) {
              let jsonStr: string = dec.decode(out);
              let jsonObj = JSON.parse(jsonStr);
              let valueArray: Array<{ offset: number; size: number }> = jsonObj.value;
              cutFilePageInfo.dataArray.push({ data: valueArray, dataTypes: 'json' });
            }
          }
        };
        splitReqBufferAddr = Module._InitializeSplitFile(Module.addFunction(cutFileCallBack, 'viiii'), REQ_BUF_SIZE);
        Module.HEAPU8.set(headArray, splitReqBufferAddr);
        Module._TraceStreamerGetLongTraceTimeSnapEx(headArray.length);
        for (let fileIndex = 0; fileIndex < splitFileInfo.length; fileIndex++) {
          let fileInfo = splitFileInfo[fileIndex];
          traceFileType = fileInfo.fileType;
          for (let pageNum = 0; pageNum < maxPageNum; pageNum++) {
            currentPageNum = pageNum;
            await splitFileAndSave(
              timStamp,
              fileInfo.fileType,
              fileInfo.startIndex,
              fileInfo.endIndex,
              fileInfo.size,
              db,
              pageNum,
              maxSize,
              splitReqBufferAddr
            );
            await initWASM();
            splitReqBufferAddr = Module._InitializeSplitFile(
              Module.addFunction(cutFileCallBack, 'viiii'),
              REQ_BUF_SIZE
            );
            Module.HEAPU8.set(headArray, splitReqBufferAddr);
            Module._TraceStreamerGetLongTraceTimeSnapEx(headArray.length);
          }
        }
        for (const [fileTypePageNum, fileMessage] of newCutFilePageInfo) {
          let fileTypePageNumArr = fileTypePageNum.split('_');
          let fileType = fileTypePageNumArr[0];
          let pageNum = Number(fileTypePageNumArr[1]);
          let saveIndex = 0;
          let saveStartOffset = 0;
          let dataArray = fileMessage.dataArray;
          let currentChunk = new Uint8Array(maxSize);
          let currentChunkOffset = 0;
          for (let fileDataIndex = 0; fileDataIndex < dataArray.length; fileDataIndex++) {
            let receiveData = dataArray[fileDataIndex];
            if (receiveData.dataTypes === 'data') {
              let receiveDataArray = receiveData.data as Uint8Array;
              if (currentChunkOffset + receiveDataArray.length > maxSize) {
                let freeSize = maxSize - currentChunkOffset;
                let freeSaveData = receiveDataArray.slice(0, freeSize);
                currentChunk.set(freeSaveData, currentChunkOffset);
                await addDataToIndexeddb(db, {
                  buf: currentChunk,
                  id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
                  fileType: `${fileType}_new`,
                  pageNum: pageNum,
                  startOffset: saveStartOffset,
                  endOffset: saveStartOffset + maxSize,
                  index: saveIndex,
                  timStamp: timStamp,
                });
                saveStartOffset += maxSize;
                saveIndex++;
                currentChunk = new Uint8Array(maxSize);
                let remnantArray = receiveDataArray.slice(freeSize);
                currentChunkOffset = 0;
                currentChunk.set(remnantArray, currentChunkOffset);
                currentChunkOffset += remnantArray.length;
              } else {
                currentChunk.set(receiveDataArray, currentChunkOffset);
                currentChunkOffset += receiveDataArray.length;
              }
            } else {
              if (receiveData.data.length > 0) {
                let needCutMessage = receiveData.data as Array<{ offset: number; size: number }>;
                let startOffset = needCutMessage[0].offset;
                let nowCutInfoList: Array<any> = [];
                let isBeforeCutFinish = false;
                for (let needCutIndex = 0; needCutIndex < needCutMessage.length; needCutIndex++) {
                  let cutInfo = needCutMessage[needCutIndex];
                  if (isBeforeCutFinish) {
                    startOffset = cutInfo.offset;
                    isBeforeCutFinish = false;
                    nowCutInfoList.length = 0;
                  }
                  if (
                    cutInfo.offset + cutInfo.size - startOffset >= maxSize * 10 ||
                    needCutIndex === needCutMessage.length - 1
                  ) {
                    nowCutInfoList.push(cutInfo);
                    let nowStartCutOffset = nowCutInfoList[0].offset;
                    let nowEndCutOffset = cutInfo.offset + cutInfo.size;
                    let searchDataInfo = allIndexDataList.filter(
                      (value: {
                        fileType: string;
                        index: number;
                        pageNum: number;
                        startOffsetSize: number;
                        endOffsetSize: number;
                      }) => {
                        return (
                          value.fileType === fileType &&
                          value.startOffsetSize <= nowEndCutOffset &&
                          value.endOffsetSize >= nowStartCutOffset
                        );
                      }
                    );
                    let startIndex = searchDataInfo[0].index;
                    let endIndex = searchDataInfo[searchDataInfo.length - 1].index;
                    let transaction = db.transaction(STORE_NAME, 'readonly');
                    let store = transaction.objectStore(STORE_NAME);
                    let index = store.index('QueryCompleteFile');
                    let range = IDBKeyRange.bound(
                      [timStamp, fileType, 0, startIndex],
                      [timStamp, fileType, 0, endIndex],
                      false,
                      false
                    );
                    const getRequest = index.openCursor(range);
                    let queryAllData = await queryDataFromIndexeddb(getRequest);
                    let mergeData = indexedDataToBufferData(queryAllData);
                    for (let cutOffsetObjIndex = 0; cutOffsetObjIndex < nowCutInfoList.length; cutOffsetObjIndex++) {
                      let cutUseOffsetObj = nowCutInfoList[cutOffsetObjIndex];
                      let endOffset = cutUseOffsetObj.offset + cutUseOffsetObj.size;
                      let sliceData = mergeData.slice(
                        cutUseOffsetObj.offset - searchDataInfo[0].startOffsetSize,
                        endOffset - searchDataInfo[0].startOffsetSize
                      );
                      let sliceDataLength = sliceData.length;
                      if (currentChunkOffset + sliceDataLength >= maxSize) {
                        let handleCurrentData = new Uint8Array(currentChunkOffset + sliceDataLength);
                        let freeSaveArray = currentChunk.slice(0, currentChunkOffset);
                        handleCurrentData.set(freeSaveArray, 0);
                        handleCurrentData.set(sliceData, freeSaveArray.length);
                        let newSliceDataLength: number = Math.ceil(handleCurrentData.length / maxSize);
                        for (let newSliceIndex = 0; newSliceIndex < newSliceDataLength; newSliceIndex++) {
                          let newSliceSize = newSliceIndex * maxSize;
                          let number = Math.min(newSliceSize + maxSize, handleCurrentData.length);
                          let saveArray = handleCurrentData.slice(newSliceSize, number);
                          if (newSliceIndex === newSliceDataLength - 1 && number - newSliceSize < maxSize) {
                            currentChunk = new Uint8Array(maxSize);
                            currentChunkOffset = 0;
                            currentChunk.set(saveArray, currentChunkOffset);
                            currentChunkOffset += saveArray.length;
                          } else {
                            await addDataToIndexeddb(db, {
                              buf: saveArray,
                              id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
                              fileType: `${fileType}_new`,
                              pageNum: pageNum,
                              startOffset: saveStartOffset,
                              endOffset: saveStartOffset + maxSize,
                              index: saveIndex,
                              timStamp: timStamp,
                            });
                            saveStartOffset += maxSize;
                            saveIndex++;
                          }
                        }
                      } else {
                        currentChunk.set(sliceData, currentChunkOffset);
                        currentChunkOffset += sliceDataLength;
                      }
                    }
                    isBeforeCutFinish = true;
                  } else {
                    nowCutInfoList.push(cutInfo);
                  }
                }
              }
            }
          }
          if (currentChunkOffset !== 0) {
            let freeArray = currentChunk.slice(0, currentChunkOffset);
            await addDataToIndexeddb(db, {
              buf: freeArray,
              id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
              fileType: `${fileType}_new`,
              pageNum: pageNum,
              startOffset: saveStartOffset,
              endOffset: saveStartOffset + maxSize,
              index: saveIndex,
              timStamp: timStamp,
            });
            saveStartOffset += maxSize;
            saveIndex++;
          }
        }
      }
    }
    self.postMessage({
      id: e.data.id,
      action: e.data.action,
      results: result,
    });
    return;
  }
};

function indexedDataToBufferData(sourceData: any): Uint8Array {
  let uintArrayLength = 0;
  let uintDataList = sourceData.map((item: any) => {
    let currentBufData = new Uint8Array(item.buf);
    uintArrayLength += currentBufData.length;
    return currentBufData;
  });
  let resultUintArray = new Uint8Array(uintArrayLength);
  let offset = 0;
  uintDataList.forEach((currentArray: Uint8Array) => {
    resultUintArray.set(currentArray, offset);
    offset += currentArray.length;
  });
  return resultUintArray;
}

async function splitFileAndSaveArkTs(
  maxSize: number,
  currentChunkOffset: number,
  currentChunk: Uint8Array,
  fileType: string,
  pageNum: number,
  saveStartOffset: number,
  saveIndex: number,
  timStamp: number,
  db: IDBDatabase
) {
  for (let arkTsAllDataIndex = 0; arkTsAllDataIndex < arkTsData.length; arkTsAllDataIndex++) {
    let currentArkTsData = arkTsData[arkTsAllDataIndex];
    let freeSize = maxSize - currentChunkOffset;
    if (currentArkTsData.length > freeSize) {
      let freeSaveData = currentArkTsData.slice(0, freeSize);
      currentChunk.set(freeSaveData, currentChunkOffset);
      let arg2 = setArg(currentChunk, fileType, pageNum, saveStartOffset, saveIndex, maxSize, timStamp);
      await addDataToIndexeddb(db, arg2);
      saveStartOffset += maxSize;
      saveIndex++;
      let remnantData = currentArkTsData.slice(freeSize);
      let remnantDataLength: number = Math.ceil(remnantData.length / maxSize);
      for (let newSliceIndex = 0; newSliceIndex < remnantDataLength; newSliceIndex++) {
        let newSliceSize = newSliceIndex * maxSize;
        let number = Math.min(newSliceSize + maxSize, remnantData.length);
        let saveArray = remnantData.slice(newSliceSize, number);
        if (newSliceIndex === remnantDataLength - 1 && number - newSliceSize < maxSize) {
          currentChunk = new Uint8Array(maxSize);
          currentChunkOffset = 0;
          currentChunk.set(saveArray, currentChunkOffset);
          currentChunkOffset += saveArray.length;
        } else {
          let arg2 = setArg(saveArray, fileType, pageNum, saveStartOffset, saveIndex, maxSize, timStamp);
          await addDataToIndexeddb(db, arg2);
          saveStartOffset += maxSize;
          saveIndex++;
        }
      }
    } else {
      currentChunk.set(currentArkTsData, currentChunkOffset);
      currentChunkOffset += currentArkTsData.length;
    }
  }
}

const splitFileAndSave = async (
  timStamp: number,
  fileType: string,
  startIndex: number,
  endIndex: number,
  fileSize: number,
  db: IDBDatabase,
  pageNum: number,
  maxSize: number,
  splitReqBufferAddr?: any
): Promise<void> => {
  let queryStartIndex = startIndex;
  let queryEndIndex = startIndex;
  let saveIndex = 0;
  let saveStartOffset = 0;
  let currentChunk = new Uint8Array(maxSize);
  let currentChunkOffset = 0;
  let resultFileSize = 0;
  do {
    queryEndIndex = queryStartIndex + 9;
    if (queryEndIndex > endIndex) {
      queryEndIndex = endIndex;
    }
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('QueryCompleteFile');
    let range = getRange(timStamp, fileType, queryStartIndex, queryEndIndex);
    const getRequest = index.openCursor(range);
    let res = await queryDataFromIndexeddb(getRequest);
    queryStartIndex = queryEndIndex + 1;
    for (let i = 0; i < res.length; i++) {
      let arrayBuffer = res[i];
      let uint8Array = new Uint8Array(arrayBuffer.buf);
      let cutFileSize = 0;
      while (cutFileSize < uint8Array.length) {
        const sliceLen = Math.min(uint8Array.length - cutFileSize, REQ_BUF_SIZE);
        const dataSlice = uint8Array.subarray(cutFileSize, cutFileSize + sliceLen);
        Module.HEAPU8.set(dataSlice, splitReqBufferAddr);
        cutFileSize += sliceLen;
        resultFileSize += sliceLen;
        if (resultFileSize >= fileSize) {
          Module._TraceStreamerLongTraceSplitFileEx(sliceLen, 1, pageNum);
        } else {
          Module._TraceStreamerLongTraceSplitFileEx(sliceLen, 0, pageNum);
        }
        if (arkTsDataSize > 0 && fileType === 'arkts') {
          splitFileAndSaveArkTs(
            maxSize,
            currentChunkOffset,
            currentChunk,
            fileType,
            pageNum,
            saveStartOffset,
            saveIndex,
            timStamp,
            db
          );
        }
      }
    }
  } while (queryEndIndex < endIndex);
  if (fileType === 'arkts' && currentChunkOffset > 0) {
    let remnantArray = new Uint8Array(currentChunkOffset);
    let remnantChunk = currentChunk.slice(0, currentChunkOffset);
    remnantArray.set(remnantChunk, 0);
    let arg2 = setArg(remnantArray, fileType, pageNum, saveStartOffset, saveIndex, maxSize, timStamp);
    await addDataToIndexeddb(db, arg2);
    arkTsDataSize = 0;
    arkTsData.length = 0;
  }
};

function setArg(
  remnantArray: Uint8Array,
  fileType: string,
  pageNum: number,
  saveStartOffset: number,
  saveIndex: number,
  maxSize: number,
  timStamp: number
): any {
  return {
    buf: remnantArray,
    id: `${fileType}_new_${timStamp}_${pageNum}_${saveIndex}`,
    fileType: `${fileType}_new`,
    pageNum: pageNum,
    startOffset: saveStartOffset,
    endOffset: saveStartOffset + maxSize,
    index: saveIndex,
    timStamp: timStamp,
  };
}
function getRange(timStamp: number, fileType: string, queryStartIndex: number, queryEndIndex: number) {
  return IDBKeyRange.bound(
    [timStamp, fileType, 0, queryStartIndex],
    [timStamp, fileType, 0, queryEndIndex],
    false,
    false
  );
}

enum DataTypeEnum {
  data,
  json,
}

let uploadSoActionId: string = '';
let uploadFileIndex: number = 0;
let uploadSoCallbackFn: any;
let soFileList: Array<File | null> = [];
const uploadSoFile = async (file: File | null): Promise<void> => {
  if (file) {
    let fileNameBuffer: Uint8Array | null = enc.encode(file.webkitRelativePath);
    let fileNameLength = fileNameBuffer.length;
    let addr = Module._InitFileName(uploadSoCallbackFn, fileNameBuffer.length);
    Module.HEAPU8.set(fileNameBuffer, addr);
    let writeSize = 0;
    let upRes = -1;
    while (writeSize < file.size) {
      let sliceLen = Math.min(file.size - writeSize, REQ_BUF_SIZE);
      let blob: Blob | null = file.slice(writeSize, writeSize + sliceLen);
      let buffer: ArrayBuffer | null = await blob.arrayBuffer();
      let data: Uint8Array | null = new Uint8Array(buffer);
      let size = file.size;
      let lastFile = uploadFileIndex === soFileList.length - 1 ? 1 : 0;
      Module.HEAPU8.set(data, reqBufferAddr);
      writeSize += sliceLen;
      upRes = Module._TraceStreamerDownloadELFEx(size, fileNameLength, sliceLen, lastFile);
      data = null;
      buffer = null;
      blob = null;
    }
    file = null;
    soFileList[uploadFileIndex] = null;
    fileNameBuffer = null;
  }
};

const uploadSoCallBack = (heapPtr: number, size: number, isFinish: number): void => {
  let out: Uint8Array | null = Module.HEAPU8.slice(heapPtr, heapPtr + size);
  if (out) {
    let res = dec.decode(out);
    out = null;
    if (res.includes('file send over')) {
      if (uploadFileIndex < soFileList.length - 1) {
        uploadFileIndex = uploadFileIndex + 1;
        uploadSoFile(soFileList[uploadFileIndex]).then();
      }
    } else {
      soFileList.length = 0;
      self.postMessage({
        id: uploadSoActionId,
        action: 'upload-so',
        results: res.includes('ok') ? 'ok' : 'failed',
      });
    }
  }
};

let splitReqBufferAddr = -1;

enum FileTypeEnum {
  data,
  json,
}

function cutFileBufferByOffSet(out: Uint8Array, uint8Array: Uint8Array) {
  let jsonStr: string = dec.decode(out);
  let jsonObj = JSON.parse(jsonStr);
  let valueArray: Array<{ offset: number; size: number }> = jsonObj.value;
  const sum = valueArray.reduce((total, obj) => total + obj.size, 0);
  let cutBuffer = new Uint8Array(sum);
  let offset = 0;
  valueArray.forEach((item, index) => {
    const dataSlice = uint8Array.subarray(item.offset, item.offset + item.size);
    cutBuffer.set(dataSlice, offset);
    offset += item.size;
  });
  return cutBuffer;
}

function cutFileByRange(e: MessageEvent) {
  let cutLeftTs = e.data.leftTs;
  let cutRightTs = e.data.rightTs;
  let uint8Array = new Uint8Array(e.data.buffer);
  let resultBuffer: Array<any> = [];
  let cutFileCallBack = cutFileCallBackFunc(resultBuffer, uint8Array, e);
  splitReqBufferAddr = Module._InitializeSplitFile(Module.addFunction(cutFileCallBack, 'viiii'), REQ_BUF_SIZE);
  let cutTimeRange = `${cutLeftTs};${cutRightTs};`;
  let cutTimeRangeBuffer = enc.encode(cutTimeRange);
  Module.HEAPU8.set(cutTimeRangeBuffer, splitReqBufferAddr);
  Module._TraceStreamerSplitFileEx(cutTimeRangeBuffer.length);
  let cutFileSize = 0;
  let receiveFileResult = -1;
  while (cutFileSize < uint8Array.length) {
    const sliceLen = Math.min(uint8Array.length - cutFileSize, REQ_BUF_SIZE);
    const dataSlice = uint8Array.subarray(cutFileSize, cutFileSize + sliceLen);
    Module.HEAPU8.set(dataSlice, splitReqBufferAddr);
    cutFileSize += sliceLen;
    try {
      if (cutFileSize >= uint8Array.length) {
        receiveFileResult = Module._TraceStreamerReciveFileEx(sliceLen, 1);
      } else {
        receiveFileResult = Module._TraceStreamerReciveFileEx(sliceLen, 0);
      }
    } catch (error) {
      self.postMessage(
        {
          id: e.data.id,
          action: e.data.action,
          cutStatus: false,
          msg: 'split failed',
          buffer: e.data.buffer,
        },
        // @ts-ignore
        [e.data.buffer]
      );
    }
  }
}
function cutFileCallBackFunc(resultBuffer: Array<any>, uint8Array: Uint8Array, e: MessageEvent): Function {
  return (heapPtr: number, size: number, fileType: number, isEnd: number) => {
    let out: Uint8Array = Module.HEAPU8.slice(heapPtr, heapPtr + size);
    if (FileTypeEnum.data === fileType) {
      resultBuffer.push(out);
    } else if (FileTypeEnum.json === fileType) {
      let cutBuffer = cutFileBufferByOffSet(out, uint8Array);
      resultBuffer.push(cutBuffer);
    }
    if (isEnd) {
      const cutResultFileLength = resultBuffer.reduce((total, obj) => total + obj.length, 0);
      let cutBuffer = new Uint8Array(cutResultFileLength);
      let offset = 0;
      resultBuffer.forEach((item) => {
        cutBuffer.set(item, offset);
        offset += item.length;
      });
      resultBuffer.length = 0;
      self.postMessage(
        {
          id: e.data.id,
          action: e.data.action,
          cutStatus: true,
          msg: 'split success',
          buffer: e.data.buffer,
          cutBuffer: cutBuffer.buffer,
        },
        // @ts-ignore
        [e.data.buffer, cutBuffer.buffer]
      );
    }
  };
}

function createView(sql: string) {
  let array = enc.encode(sql);
  Module.HEAPU8.set(array, reqBufferAddr);
  let res = Module._TraceStreamerSqlOperateEx(array.length);
  return res;
}

function queryJSON(name: string, sql: string, params: any) {
  query(name, sql, params);
  return convertJSON();
}

function query(name: string, sql: string, params: any): void {
  if (params) {
    Reflect.ownKeys(params).forEach((key: any) => {
      if (typeof params[key] === 'string') {
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), `'${params[key]}'`);
      } else {
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), params[key]);
      }
    });
  }
  start = new Date().getTime();
  let sqlUintArray = enc.encode(sql);
  Module.HEAPU8.set(sqlUintArray, reqBufferAddr);
  Module._TraceStreamerSqlQueryEx(sqlUintArray.length);
}

function querySdk(name: string, sql: string, sdkParams: any, action: string) {
  if (sdkParams) {
    Reflect.ownKeys(sdkParams).forEach((key: any) => {
      if (typeof sdkParams[key] === 'string') {
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), `'${sdkParams[key]}'`);
      } else {
        sql = sql.replace(new RegExp(`\\${key}`, 'g'), sdkParams[key]);
      }
    });
  }
  let sqlUintArray = enc.encode(sql);
  let commentId = action.substring(action.lastIndexOf('-') + 1);
  let key = Number(commentId);
  let wasm = thirdWasmMap.get(key);
  if (wasm != undefined) {
    let wasmModel = wasm.model;
    wasmModel.HEAPU8.set(sqlUintArray, wasm.bufferAddr);
    wasmModel._TraceStreamerSqlQueryEx(sqlUintArray.length);
  }
}

function queryMetric(name: string): void {
  start = new Date().getTime();
  let metricArray = enc.encode(name);
  Module.HEAPU8.set(metricArray, reqBufferAddr);
  Module._TraceStreamerSqlMetricsQuery(metricArray.length);
}

const DB_NAME = 'sp';
const DB_VERSION = 1;
const STORE_NAME = 'longTable';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
    openRequest.onerror = () => reject(openRequest.error);
    openRequest.onsuccess = () => {
      resolve(openRequest.result);
    };
  });
}

function queryDataFromIndexeddb(getRequest: IDBRequest<IDBCursorWithValue | null>): Promise<any> {
  return new Promise((resolve, reject) => {
    let results: any[] = [];
    getRequest.onerror = (event) => {
      // @ts-ignore
      reject(event.target.error);
    };
    getRequest.onsuccess = (event) => {
      // @ts-ignore
      const cursor = event.target!.result;
      if (cursor) {
        results.push(cursor.value);
        cursor['continue']();
      } else {
        // @ts-ignore
        resolve(results);
      }
    };
  });
}

function addDataToIndexeddb(db: IDBDatabase, value: any, key?: IDBValidKey) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(value, key);
    request.onsuccess = function (event) {
      // @ts-ignore
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event);
    };
  });
}
