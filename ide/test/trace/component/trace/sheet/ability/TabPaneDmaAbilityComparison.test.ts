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
import { TabPaneDmaAbilityComparison } from '../../../../../../src/trace/component/trace/sheet/ability/TabPaneDmaAbilityComparison';
const dmaSqlite = require('../../../../../../src/trace/database/sql/Dma.sql');
jest.mock('../../../../../../src/trace/database/sql/Dma.sql');
jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
    return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
    return {
        removeAttribute: () => {},
        snapshotDataSource: () => {},
    };
});

jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
    return {};
});

jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
// @ts-ignore
window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

describe('TabPaneDmaAbilityComparison Test', () => {
    let tabPaneDmaComparisonAbility = new TabPaneDmaAbilityComparison();
    let getTabDmaAbilityComparisonData = dmaSqlite.getTabDmaAbilityComparisonData;
    let dmaSelectionData = [
        {
            startNs: 0,
            value:100,
            processId:10,
            processName:'a',
        }
    ];
    let datalist = [
        {
            name: 'Snapshot2',
            startNs: 333526561,
            type: 'ability',
            value: 110,
        },
        {
            name: 'Snapshot1',
            startNs: 13454688,
            type: 'ability',
            value: 78,
        },
    ];
    tabPaneDmaComparisonAbility.init = jest.fn(() => true);
    getTabDmaAbilityComparisonData.mockResolvedValue(dmaSelectionData);
    it('TabPaneDmaSelectAbility01', function () {
        expect(tabPaneDmaComparisonAbility.queryDataByDB(10)).toBeTruthy();
    });
    it('TabPaneDmaSelectAbility02', function () {
        expect(tabPaneDmaComparisonAbility.getComparisonData(10)).toBeTruthy();
    });
    it('TabPaneDmaSelectAbility03', function () {
        expect(tabPaneDmaComparisonAbility.comparisonDataByDB(10,datalist)).toBeTruthy();
    });
    it('TabPaneDmaSelectAbility04', function () {
        expect(tabPaneDmaComparisonAbility.selectStamps(datalist)).toBeUndefined();
    });
})
