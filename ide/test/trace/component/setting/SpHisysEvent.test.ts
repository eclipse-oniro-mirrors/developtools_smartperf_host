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

import { SpHisysEvent } from '../../../../src/trace/component/setting/SpHisysEvent';

describe('SpHisysEvent Test', () => {
    let spHisysEvent = new SpHisysEvent();
    it('SpHisysEventTest01', function () {
        spHisysEvent.startSamp = true;
        expect(spHisysEvent.startSamp).toBeTruthy();
    });
    it('SpHisysEventTest02 ', function () {
        spHisysEvent.startSamp = false;
        expect(spHisysEvent.startSamp).toBeFalsy();
    });
    it('SpHisysEventTest03 ', function () {
        expect(spHisysEvent.domain).not.toBeUndefined();
    });
    it('SpHisysEventTest04 ', function () {
        expect(spHisysEvent.eventName).not.toBeUndefined();
    });
})
