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
// @ts-ignore
import * as path from 'path';

const profilerServicePath = path.join(
  // @ts-ignore
  __dirname,
  '../proto',
  'profiler_service.proto'
);

export class ProfilerClient {
  // proto filePaths
  private _filePaths: Array<String> | undefined;
  // client
  private _client: any;
  // profiler_proto
  private _profiler_proto: any;

  // ProfilerClient constructor
  public constructor(address: Address) {
    // load client port
    let clientPort = this.loadAddress(address);
    // load proto file
    this.start(clientPort, profilerServicePath);
  }

  get filePaths(): Array<String> | undefined {
    return this._filePaths;
  }

  set filePaths(value: Array<String> | undefined) {
    this._filePaths = value;
  }

  get client(): any {
    return this._client;
  }

  set client(value: any) {
    this._client = value;
  }

  get profiler_proto(): any {
    return this._profiler_proto;
  }

  set profiler_proto(value: any) {
    this._profiler_proto = value;
  }

  start(address: string, filePath: string) {}

  // Address
  loadAddress(clientAddress: Address): string {
    return clientAddress.host + ':' + clientAddress.port;
  }

  public getProfilerClient(callback: any): any {
    return this._client;
  }

  public getCapabilities(callback: any) {
    this._client.this._client.getCapabilities(callback);
    callback();
  }

  public createSession(callback: any) {
    this._client.createSession(callback);
    callback();
  }

  public startSession(callback: any) {
    this._client.startSession(callback);
    callback();
  }

  public stopSession(callback: any) {
    this._client.stopSession(callback);
    callback();
  }

  public destroySession(callback: any) {
    this._client.destroySession(callback);
    callback();
  }

  public keepSession(callback: any) {
    this._client.keepSession(callback);
    callback();
  }

  public shutdown(): void {}

  public getChannel() {
    return this._client.channelInterpretation;
  }
}

export interface Address {
  // port
  port: string | number;

  // host
  host?: string | number;
}
