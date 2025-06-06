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

export const SpRecordSettingHtml = `
<style>
.root {
    padding-top: 45px;
    padding-left: 41px;
    background: var(--dark-background3,#FFFFFF);
    font-size:16px;
    border-radius: 0 16px 16px 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    grid-template-rows: min-content min-content min-content;
    grid-gap: 50px;
}
:host{
    display: block;
    border-radius: 0 16px 16px 0;
    background: background: var(--dark-background3,#FFFFFF);
    position: relative;
    width: 100%;
    height: 100%;
}
#longTraceRadio{
    display: none;
}
:host([trace_config]) #longTraceRadio{
    display: block;
}
.record-mode{
    font-family: Helvetica-Bold;
    font-size: 16px;
    color: var(--dark-color1,#000000);
    line-height: 28px;
    font-weight: 700;
    margin-bottom: 16px;
    grid-column: span 1;
}
.record{
    display:flex;
    flex-direction: column;
}

.output{
    display:grid;
}

.trace_file_span {
    width: 20%;
    height: 1em;
    margin: 0;
}

#trace_path {
   background-color: var(--dark-background5,#FFFFFF)
   font-family: Helvetica-Bold;
   color:  var(--dark-color1,#8f8c8c);
   margin: 0;
   width: 25%;
   height: 25px;
   border-radius: 8px;
   outline: none;
   border: 1px solid #ccc;
}
.buffer-size, .snapShot{
    height: min-content;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr min-content;
}

.max-duration, .max-single-file-size{
    height: min-content;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr min-content;
}

#litradio{
    opacity: 0.9;
    font-family: Helvetica;
    font-size: 14px;
    color: var(--dark-color1,#000000);
    text-align: left;
    line-height: 16px;
    font-weight: 400;
    margin-right: 20px;
}

button{
    height: 25px;
    width: 100%;
    border: 0;
    text-align: left;
    padding-left: 20px;
    margin-top: 10px;
    background-color: #E4E3E9;
}

.line{
    width: 100%;
    height: 1px;
    overflow: hidden;
    border-top: 1px solid #C5C7CF;
    background: #E4E3E9;
    margin-top: 4px;
    display: inline-block;
    vertical-align: middle;
}

.max_duration_result, .memory_buffer_result, .max_size_result, .snapShot_result{
    background-color: var(--dark-background5,#F2F2F2);
    color:var(--dark-color,#6a6f77);
    border: none;
     -webkit-appearance:none;
    outline:0;
    font-size:14px;
    text-align: center;
    width: 90px;
    margin: 5px 0 5px 5px;
}

.resultValue, .resultSize, .snapShotResultValue{
    -webkit-appearance:none;
    color:var(--dark-color,#6a6f77);
    border-radius:20px;
    margin: 0 30px 0 0;
    background-color: var(--dark-background5,#F2F2F2);
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns:  min-content min-content;
    width: 150px;
    height: 40px;
    outline:0;
    border:1px solid var(--dark-border,#c8cccf);
}

#memory-buffer, #max-duration, #max-size, #snapShot {
    margin: 0 8px;
    grid-column: span 2;
}

.record-title{
    margin-bottom: 16px;
    grid-column: span 3;
}

.record-prompt{
      opacity: 0.6;
      font-family: Helvetica;
      font-size: 14px;
      text-align: center;
      line-height: 35px;
      font-weight: 400;
}

</style>
<div class="root">
  <div class="record">
    <span class="record-mode">Record mode</span>
    <div style="display: flex;">
       <lit-radio name="radio" dis="round" id="litradio" checked>Normal Mode</lit-radio>
       <lit-radio name="radio" dis="round" id="longTraceRadio">Long Trace Mode</lit-radio>
    </div>
  </div>
  <div class="output">
    <span class="record-mode">output file path</span>
    <div>
      <span class="trace_file_span">/data/local/tmp/</span>
      <input id="trace_path" type="text" value='hiprofiler_data.htrace' 
      onkeydown="this.value.length >= 100 ? this.value = this.value.substring(0,99): 0" 
      oninput="this.value= this.value.replace('__','_')" 
      onkeyup="this.value=this.value.replace(/[^\\w\\.]/g,'')">
    </div>
  </div>
  <div class="buffer-size">
    <div class="record-title">
        <span class="record-mode">In-memory buffer size</span> 
        <span class="record-prompt"> (max memory buffer size is 512 MB) </span>
    </div>
    <lit-slider id="memory-buffer" defaultColor="var(--dark-color3,#46B1E3)" open dir="right">
    </lit-slider>
    <div class='resultSize'>
        <input class="memory_buffer_result" type="text" value='64' 
        onkeyup="this.value=this.value.replace(/\\D/g,'')" 
        oninput="if(this.value > 512){this.value = '512'} if(this.value > 0 && 
        this.value.toString().startsWith('0')){ this.value = Number(this.value) }" >
        <span style="text-align: center; margin: 8px"> MB </span>
    </div>
  </div>
  <div class="max-duration">
    <div class="record-title">
        <span class="record-mode" >Max duration</span>
        <span class="record-prompt"> (max duration value is 01:00:00) </span>
    </div>
    <lit-slider id="max-duration" defaultColor="var(--dark-color4,#61CFBE)" open dir="right">
    </lit-slider>
    <div class='resultValue'>
        <input class="max_duration_result" type="text" value = '00:00:30' >
        <span style="text-align: center; margin: 8px 8px 8px 0"> h:m:s </span>
    </div>
  </div>
  <div class="snapShot">
    <div class="record-title">
        <span class="record-mode" >SnapShot</span>
        <span class="record-prompt"> (max snapShot value is 1000MS and min snapShot value is 200MS) </span>
    </div>
    <lit-slider id="snapShot" defaultColor="var(--dark-color4,#cdcafa)" open dir="right">
    </lit-slider>
    <div class='snapShotResultValue'>
        <input class="snapShot_result" type="text" value = '0' onkeyup="this.value=this.value.replace(/\\D/g,'')" 
        oninput="if(this.value < 0){this.value = '0'} if(this.value > 1000){this.value = '1000'} if(this.value > 0 && 
        this.value.toString().startsWith('0')){ this.value = Number(this.value) }">
        <span style="text-align: center; margin: 8px 8px 8px 0"> MS </span>
    </div>
  </div>
</div>
`;
