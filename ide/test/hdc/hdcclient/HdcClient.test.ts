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

import { HdcClient } from '../../../src/hdc/hdcclient/HdcClient';

describe('HdcClient Test', () => {
  let hdcClient = new HdcClient();
  it('HdcClientTest01', function () {
    expect(hdcClient.bindStream()).toBeUndefined();
  });
  it('HdcClientTest02', function () {
    expect(hdcClient.unbindStream()).toBeTruthy();
  });
  it('HdcClientTest03', function () {
    expect(hdcClient.unbindStopStream()).toBeTruthy();
  });

  it('HdcClientTest04', async () => {
    await expect(hdcClient.connectDevice()).rejects.not.toBeUndefined();
  });

  it('HdcClientTest05', async () => {
    await expect(hdcClient.disconnect()).not;
  });
  it('HdcClientTest06', function () {
    let data = {
      getChannelId: jest.fn(() => -1),
    };
    expect(hdcClient.createDataMessage(data)).toBeUndefined();
  });
  it('HdcClientTest07', function () {
    expect(hdcClient.bindStream()).toBeUndefined();
  });
});
