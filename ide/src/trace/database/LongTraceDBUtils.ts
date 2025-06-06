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

import { IndexedDBHelp } from './IndexedDBHelp';

export class LongTraceDBUtils {
  public static instance: LongTraceDBUtils | undefined;
  dbVersion: number = 1;
  dbName: string = 'sp';
  fileType: string = 'trace';
  tableName: string = 'longTable';
  indexedDBHelp: IndexedDBHelp = new IndexedDBHelp();

  public static getInstance(): LongTraceDBUtils {
    if (!this.instance) {
      this.instance = new LongTraceDBUtils();
    }
    return this.instance;
  }

  createDBAndTable(): Promise<IDBDatabase> {
    return this.indexedDBHelp.open(this.dbName, this.dbVersion, [
      {
        name: this.tableName,
        objectStoreParameters: { keyPath: 'id' },
        dataItems: [
          { name: 'QueryCompleteFile', keypath: ['timStamp', 'fileType', 'pageNum', 'index'] },
          { name: 'QueryFileByPage', keypath: ['timStamp', 'fileType', 'pageNum'] },
        ],
      },
    ]);
  }

  getByRange(range: IDBKeyRange): // @ts-ignore
  Promise<unknown> {
    return this.indexedDBHelp.get(this.tableName, range, 'QueryFileByPage');
  }

  addLongTableData(
    data: ArrayBuffer,
    fileType: string,
    timStamp: number,
    pageNumber: number,
    index: number,
    offset: number,
    sliceLen: number
  ): // @ts-ignore
  Promise<unknown> {
    return this.indexedDBHelp.add(this.tableName, {
      buf: data,
      id: `${fileType}_${timStamp}_${pageNumber}_${index}`,
      fileType: fileType,
      pageNum: pageNumber,
      startOffset: offset,
      endOffset: offset + sliceLen,
      index: index,
      timStamp: timStamp,
    });
  }
}
