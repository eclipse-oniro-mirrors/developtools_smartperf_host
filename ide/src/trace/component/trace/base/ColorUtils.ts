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

import { CpuStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { HangType } from '../../chart/SpHangChart';

export class ColorUtils {
  public static GREY_COLOR: string = '#f0f0f0';

  public static FUNC_COLOR_A: Array<string> = [
    '#A37775',
    '#B1CDF1',
    '#76D1C0',
    '#0CBDD4',
    '#36BAA4',
    '#69D3E5',
    '#E3AA7D',
    '#7DA6F4',
    '#E68C43',
    '#99C47C',
    '#A56DF5',
    '#E86B6A',
    '#DC8077',
    '#ADB7DB',
    '#A1CD94',
    '#66C7BA',
    '#998FE6',
    '#E7B75D',
    '#8770D3',
    '#93D090',
  ];
  public static FUNC_COLOR_B: Array<string> = [
    '#23b0e7',
    '#aa4fba',
    '#4ca694',
    '#8d9171',
    '#ebc247',
    '#8a8a8b',
    '#78aec2',
    '#FF0066',
    '#a16a40',
    '#e05b52',
    '#7a9160',
    '#9fafc4',
    '#9bb87a',
    '#8091D0',
    '#c2cc66',
    '#a94eb9',
    '#8983B5',
    '#B9A683',
    '#40b3e7',
    '#789876',
  ];

  public static ANIMATION_COLOR: Array<string> = [
    '#ECECEC',
    '#FE3000',
    '#61CFBE',
    '#000',
    '#FFFFFF',
    '#C6D9F2',
    '#BFEBE5',
    '#0A59F7',
    '#25ACF5',
    '#FFFFFF',
  ];

  public static JANK_COLOR: Array<string> = [
    '#42A14D',
    '#C0CE85',
    '#FF651D',
    '#E8BE44',
    '#009DFA',
    '#E97978',
    '#A8D1F4',
  ];
  public static MD_PALETTE: Array<string> = ColorUtils.FUNC_COLOR_B;
  public static FUNC_COLOR: Array<string> = ColorUtils.FUNC_COLOR_B;
  public static getHilogColor(loglevel: string | number): string {
    let logColor: string = '#00000';
    switch (loglevel) {
      case 0:
      case 'D':
      case 'Debug':
        logColor = '#00BFBF';
        break;
      case 1:
      case 'I':
      case 'Info':
        logColor = '#00BF00';
        break;
      case 2:
      case 'W':
      case 'Warn':
        logColor = '#BFBF00';
        break;
      case 3:
      case 'E':
      case 'Error':
        logColor = '#FF4040';
        break;
      case 4:
      case 'F':
      case 'Fatal':
        logColor = '#BF00A4';
        break;
      default:
        break;
    }
    return logColor;
  }

  public static getHangColor(hangType: HangType): string {
    return ({
      'Instant': '#559CFF',
      'Circumstantial': '#E8BE44',
      'Micro': '#FEB354',
      'Severe': '#FC7470',
      '': '#000000',
    })[hangType];
  }

  public static getHisysEventColor(level: string | number): string {
    let eventColor: string = '#00000';
    switch (level) {
      case 0:
      case 'MINOR':
        eventColor = '#000000';
        break;
      case 1:
      case 'CRITICAL':
        eventColor = '#FF4040';
        break;
      default:
        break;
    }
    return eventColor;
  }

  public static hash(str: string, max: number): number {
    let colorA: number = 0x811c9dc5;
    let colorB: number = 0xfffffff;
    let colorC: number = 16777619;
    let colorD: number = 0xffffffff;
    let hash: number = colorA & colorB;

    for (let index: number = 0; index < str.length; index++) {
      hash ^= str.charCodeAt(index);
      hash = (hash * colorC) & colorD;
    }
    return Math.abs(hash) % max;
  }

  public static colorForThread(thread: CpuStruct): string {
    if (thread === null) {
      return ColorUtils.GREY_COLOR;
    }
    let tid: number | undefined | null = (thread.processId || -1) >= 0 ? thread.processId : thread.tid;
    return ColorUtils.colorForTid(tid || 0);
  }

  public static colorForTid(tid: number): string {
    let colorIdx: number = ColorUtils.hash(`${tid}`, ColorUtils.MD_PALETTE.length);
    return ColorUtils.MD_PALETTE[colorIdx];
  }

  public static colorForName(name: string): string {
    let colorIdx: number = ColorUtils.hash(name, ColorUtils.MD_PALETTE.length);
    return ColorUtils.MD_PALETTE[colorIdx];
  }

  public static formatNumberComma(str: number): string {
    if (str === undefined || str === null) {
      return '';
    }
    let unit = str >= 0 ? '' : '-';
    let l = Math.abs(str).toString().split('').reverse();
    let t: string = '';
    for (let i = 0; i < l.length; i++) {
      t += l[i] + ((i + 1) % 3 === 0 && i + 1 !== l.length ? ',' : '');
    }
    return unit + t.split('').reverse().join('');
  }

  public static hashFunc(str: string, depth: number, max: number): number {
    let colorA: number = 0x811c9dc5;
    let colorB: number = 0xfffffff;
    let colorC: number = 16777619;
    let colorD: number = 0xffffffff;
    let hash: number = colorA & colorB;
    let st = str.replace(/[0-9]+/g, '');
    for (let index: number = 0; index < st.length; index++) {
      hash ^= st.charCodeAt(index);
      hash = (hash * colorC) & colorD;
    }
    return (Math.abs(hash) + depth) % max;
  }

  public static funcTextColor(val: string): string {
    let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 把颜色值变成小写
    let color = val.toLowerCase();
    let result = '';
    if (reg.test(color)) {
      if (color.length === 4) {
        let colorNew = '#';
        for (let i = 1; i < 4; i += 1) {
          colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
        }
        color = colorNew;
      }
      let colorChange = [];
      for (let i = 1; i < 7; i += 2) {
        colorChange.push(parseInt(`0x${color.slice(i, i + 2)}`));
      }
      let grayLevel = colorChange[0] * 0.299 + colorChange[1] * 0.587 + colorChange[2] * 0.114;
      if (grayLevel >= 100) {
        //浅色模式
        return '#000';
      } else {
        return '#fff';
      }
    } else {
      result = '无效';
      return result;
    }
  }
}
export function interpolateColorBrightness(colorHex: string, percentage: number): number[] {
  const color = hexToRgb(colorHex);
  if (color.length === 0) {
    return [];
  }
  const [h, s, l] = rgbToHsl(color[0] / 255, color[1] / 255, color[2] / 255);

  // 根据百分比计算亮度插值
  const interpolatedL = 1 - percentage * 0.75; // 百分比越高，亮度越低

  // 将插值后的亮度值与原始的色相和饱和度值组合
  const interpolatedColor = hslToRgb(h, s, interpolatedL);
  return interpolatedColor.map((val) => Math.round(val * 255));
}

function rgbToHsl(r: number, g: number, b: number): number[] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hexToRgb(colorHex: string): number[] {
  // 16进制颜色值
  const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
  let color = colorHex.toLowerCase();
  if (reg.test(color)) {
    // 如果只有三位的值，需变成六位，如：#fff => #ffffff
    if (color.length === 4) {
      let colorNew = '#';
      for (let i = 1; i < 4; i += 1) {
        colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
      }
      color = colorNew;
    }
    // 处理六位的颜色值，转为RGB
    let rgb = [];
    for (let i = 1; i < 7; i += 2) {
      rgb.push(parseInt(`0x${color.slice(i, i + 2)}`));
    }
    return rgb;
  }
  return [];
}

function hslToRgb(h: number, s: number, l: number): number[] {
  let r = 0;
  let g = 0;
  let b = 0;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}
