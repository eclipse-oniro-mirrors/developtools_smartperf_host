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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SpHiSysEnergyChart } from '../../../chart/SpHiSysEnergyChart';
import '../../../../../base-ui/table/lit-table';
import { resizeObserver } from '../SheetUtils';
import {getTabPowerBatteryData} from "../../../../database/sql/ProcessThread.sql";

@element('tabpane-power-battery')
export class TabPanePowerBattery extends BaseElement {
  private tblPower: LitTable | null | undefined;

  set data(valPower: SelectionParam | any) {
    this.queryDataByDB(valPower);
  }

  connectedCallback() {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tblPower!);
  }

  initElements(): void {
    this.tblPower = this.shadowRoot?.querySelector<LitTable>('#tb-power-battery-energy');
  }

  queryDataByDB(val: SelectionParam | any) {
    getTabPowerBatteryData(val.rightNs).then((result) => {
      let powerData: any = {
        POWER_IDE_BATTERY: {
          gas_gauge: [],
          charge: [],
          screen: [],
          level: [],
          current: [],
          capacity: [],
          appName: '',
          uid: [],
        },
      };
      result.forEach((item) => {
        let powerDatum: any = powerData[item.eventName];
        if (item.appKey.toLocaleLowerCase() === 'appname') {
          powerDatum.appName = SpHiSysEnergyChart.app_name;
        } else {
          let eventData: Array<string> = item.eventValue.split(',');
          let eventValue = eventData[eventData.length - 1] || '';
          powerDatum[item.appKey.toLocaleLowerCase()] = eventValue;
        }
      });
      let list = [
        { name: 'Gas Gauge', value: powerData.POWER_IDE_BATTERY.gas_gauge + ' mAh' },
        { name: 'Charge', value: powerData.POWER_IDE_BATTERY.charge },
        { name: 'Screen', value: powerData.POWER_IDE_BATTERY.screen },
        { name: 'Level', value: powerData.POWER_IDE_BATTERY.level + ' %' },
        { name: 'Current', value: powerData.POWER_IDE_BATTERY.current + ' mA' },
        { name: 'Capacity', value: powerData.POWER_IDE_BATTERY.capacity + ' mAh' },
        { name: 'APP Name', value: SpHiSysEnergyChart.app_name! },
      ];

      this.tblPower!.recycleDataSource = list;

      this.tblPower?.shadowRoot?.querySelectorAll<HTMLDivElement>('.tr').forEach((tr) => {
        const td = tr.querySelectorAll<HTMLDivElement>('.td');
        this.setTableStyle(td[0], '0.9', '16px');
        this.setTableStyle(td[1], '0.6', '20px');
      });
    });
  }

  setTableStyle(td: HTMLDivElement, opacity: string, lineHeight: string) {
    td.style.fontWeight = '400';
    td.style.fontSize = '14px';
    td.style.opacity = opacity;
    td.style.lineHeight = lineHeight;
  }

  initHtml(): string {
    return `
        <style>
            .power-battery-bottom-scroll-area{
                display: flex;
                height: auto;
                overflow-y: auto;
                margin-top: 1.2em;
            }
            .power-battery-battery-canvas{
                width: 50%;
                padding: 0 10px;
            }
         
        </style>
        <div style="width: 100%;height: auto;position: relative">
            <div class="power-battery-bottom-scroll-area">
                <div class="power-battery-battery-canvas">
                    <lit-table id="tb-power-battery-energy" no-head style="height: auto">
                        <lit-table-column title="name" data-index="name" key="name" align="flex-start"  width="180px"></lit-table-column>
                        <lit-table-column title="value" data-index="value" key="value" align="flex-start" ></lit-table-column>
                    </lit-table>
                </div>
            </div>
        </div>
        `;
  }
}
