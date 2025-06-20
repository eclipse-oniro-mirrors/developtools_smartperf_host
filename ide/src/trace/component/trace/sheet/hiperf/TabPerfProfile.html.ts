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

export const TabPerfProfileHtml = `
<style>
tab-pane-filter {
    position: fixed;
    bottom: 0;
    width: 100%;
    border: solid rgb(216,216,216) 1px;
    float: left;
}
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 10px 0 10px;
    height: calc(100% - 20px);
}
.perf-profile-progress{
    bottom: 33px;
    position: absolute;
    height: 1px;
    left: 0;
    right: 0;
}
selector{
    display: none;
}
.perf-profile-loading{
    bottom: 0;
    position: absolute;
    left: 0;
    right: 0;
    width:100%;
    background:transparent;
    z-index: 999999;
}
.show{
    display: flex;
    flex: 1;
}
</style>
<div class="perf-profile-content" style="display: flex;flex-direction: column">
<lit-headline class="titleBox"></lit-headline>
<selector id='show_table' class="show">
    <lit-slicer style="width:100%">
    <div id="left_table" style="width: 65%">
        <tab-native-data-modal id="modal"></tab-native-data-modal>
        <lit-table id="tb-perf-profile" style="height: auto" tree>
            <lit-table-column width="50%" title="Call Stack" data-index="symbol" key="symbol" 
            align="flex-start" retract></lit-table-column>
            <lit-table-column width="1fr" title="Local" data-index="selfDur" key="selfDur" 
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="Sample Count" data-index="weight" key="weight" 
            align="flex-start"  order tdJump></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="weightPercent" key="weightPercent" 
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="Event Count" data-index="eventCount" key="eventCount" 
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="eventPercent" key="eventPercent" 
            align="flex-start"  order></lit-table-column>
        </lit-table>
        
    </div>
    <lit-slicer-track ></lit-slicer-track>
    <lit-table id="tb-perf-list" no-head hideDownload 
    style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)">
        <span slot="head">Heaviest Stack Trace</span>
        <lit-table-column width="60px" title="" data-index="type" key="type"  align="flex-start" >
            <template>
                <img src="img/library.png" size="20" v-if=" type == 1 ">
                <img src="img/function.png" size="20" v-if=" type == 0 ">
            </template>
        </lit-table-column>
        <lit-table-column width="1fr" title="" data-index="symbol" key="symbol"  
        align="flex-start"></lit-table-column>
    </lit-table>
    </div>
    </lit-slicer>
 </selector>
 <tab-pane-filter id="filter" input inputLeftText icon tree perf></tab-pane-filter>
 <lit-progress-bar class="progress perf-profile-progress"></lit-progress-bar>
<selector id='show_chart'>
    <tab-framechart id='framechart' style='width: 100%;height: auto'> </tab-framechart>
</selector>  
<div class="loading perf-profile-loading"></div>
</div>`;
