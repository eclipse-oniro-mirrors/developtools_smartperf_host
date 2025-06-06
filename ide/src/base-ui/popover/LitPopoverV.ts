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

import { BaseElement, element } from '../BaseElement';
import { replacePlaceholders } from '../utils/Template';
import { SpSystemTrace } from '../../trace/component/SpSystemTrace';
import { SpChartList } from '../../trace/component/trace/SpChartList';
import { dpr } from '../../trace/component/trace/base/Extension';
let css = `
<style>
    :host{ 
        outline: none;
        display:inline-block;
        position: relative;
        overflow: visible;
    }
    
    .title{
        padding: 6px 15px;
        font-weight: bold;
        font-size: 0.9rem;
        border-bottom: 1px solid #f0f0f0;
    }
    .content{
        padding: 10px;
    }
   .trigger-click {
        position: absolute;
        visibility: hidden;
        z-index: -100;
        width: 100%;
        height: 100%;
    }
    /*通用*/
    .popover{
        width: {1};
        min-width: 160px;
        display: flex;
        flex-direction: column;
        visibility: hidden;
        opacity: 0;
        transition: all 0.3s;
        z-index: 1;
        position: absolute;
        border-radius: 2px;
        background-color: var(--dark-background3,#fff);
        box-shadow: 0 0 20px #00000044;
    }
    .popover:after{
        content: '';
        display: flex;
        position: absolute;
        width: 12px;
        height: 12px;
        background: linear-gradient(45deg, var(--dark-background3,#FFFFFF),
        var(--dark-background3,#FFFFFF) 50%, transparent 50%, transparent 100%);
    }
    :host(:not([placement])) .popover,
    :host([placement='top']) .popover{
        top: 0;
        left: 50%;
        right: 0;
        transform: translate(-50%,calc(-100% - 12px)) scale(0.5);
        transform-origin: bottom;
    }
    :host(:not([placement])) .popover:after,
    :host([placement='top']) .popover:after{
        border-top: 6px solid #fff;
        left: 0;
        top: calc(100%);
        transform: translate(-50%,0%);
        left: 50%;
    }
    :host(:not([placement])[trigger='hover']:hover)  .popover,
    :host(:not([placement]):not([trigger]):hover)  .popover,
    :host([placement='top'][trigger='hover']:hover)  .popover, 
    :host([placement='top']:not([trigger]):hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-50%,calc(-100% - 12px)) scale(1);
    }
    :host(:not([placement])[trigger='click']) input[type=checkbox]:checked ~ .popover,
    :host([placement='top'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-50%,calc(-100% - 12px)) scale(1);
    }
    :host([placement='topLeft']) .popover{
        top: 0;
        left: 50%;
        right: 0;
        transform: translate(0,calc(-100% - 12px)) scale(0.5);
        transform-origin: left bottom;
    }
    :host([placement='topLeft']) .popover:after{
        top: 99%;
        transform: rotateX(180deg);
    }
    :host([placement='topLeft']:not([trigger]):hover)  .popover, 
    :host([placement='topLeft'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(-100% - 12px)) scale(1);
    }
    :host([placement='topLeft'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(-100% - 12px)) scale(1);
    }
    :host([placement='topRight']) .popover{
        top: 0;
        right: 0;
        transform: translate(0,calc(-100% - 12px)) scale(0.5);
        transform-origin: right bottom;
    }
    :host([placement='topRight']) .popover:after{
        border-top: 6px solid #fff;
        top: calc(100%);
        transform: translate(0%,0%);
        right: 20px;
    }
    :host([placement='topRight']:not([trigger]):hover)  .popover, 
    :host([placement='topRight'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(-100% - 12px)) scale(1);
    }
    :host([placement='topRight'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(-100% - 12px)) scale(1);
    }
    :host([placement='leftTop']) .popover{
        top: 0;
        right: 100%;
        transform: translate(-12px,0) scale(0.5);
        transform-origin: right top;
    }
    :host([placement='leftTop']) .popover:after{
        border-left: 6px solid #fff;
        top: 10px;
        right: -12px;
        transform: translate(0px,0%);
    }
    :host([placement='leftTop']:not([trigger]):hover)  .popover, 
    :host([placement='leftTop'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        right: 100%;
        transform: translate(-12px,0) scale(1);
    }
    :host([placement='leftTop'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-12px,0) scale(1);
    }
    :host([placement='left']) .popover{
        right: 100%;
        top: 50%;
        transform: translate(-12px,-50%) scale(0.5);
        transform-origin: right center;
    }
    :host([placement='left']) .popover:after{
        border-left: 6px solid #fff;
        top: 50%;
        right: -12px;
        transform: translate(0px,-50%);
    }
    :host([placement='left']:not([trigger]):hover)  .popover, 
    :host([placement='left'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        right: 100%;
        transform: translate(-12px,-50%) scale(1);
    }
    :host([placement='left'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-12px,-50%) scale(1);
    }
    :host([placement='leftBottom']) .popover{
        right: 100%;
        bottom: 0;
        transform: translate(-12px,0%) scale(0.5);
        transform-origin: right bottom;
    }
    :host([placement='leftBottom']) .popover:after{
        border-left: 6px solid #fff;
        bottom: 10px;
        right: -12px;
        transform: translate(0px,-50%);
    }
    :host([placement='leftBottom']:not([trigger]):hover)  .popover, 
    :host([placement='leftBottom'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        right: 100%;
        transform: translate(-12px,0%) scale(1);
    }
    :host([placement='leftBottom'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-12px,0%) scale(1);
    }
    :host([placement='rightTop']) .popover{
        top: 0;
        left: 100%;
        transform: translate(12px,0) scale(0.5);
        transform-origin: left top;
    }
    :host([placement='rightTop']) .popover:after{
        border-right: 6px solid #fff;
        top: 10px;
        left: -12px;
        transform: translate(0px,0%);
    }
    :host([placement='rightTop']:not([trigger]):hover)  .popover, 
    :host([placement='rightTop'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        left: 100%;
        transform: translate(12px,0) scale(1);
    }
    :host([placement='rightTop'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(12px,0) scale(1);
    }
    :host([placement='right']) .popover{
        top: 50%;
        left: 100%;
        transform: translate(12px,-50%) scale(0.5);
        transform-origin: left center;
    }
    :host([placement='right']) .popover:after{
        border-right: 6px solid #fff;
        top: 50%;
        left: -12px;
        transform: translate(0px,-50%);
    }
    :host([placement='right']:not([trigger]):hover)  .popover, 
    :host([placement='right'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        left: 100%;
        transform: translate(12px,-50%) scale(1);
    }
    :host([placement='right'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(12px,-50%) scale(1);
    }
    :host([placement='rightBottom']) .popover{
        bottom: 0;
        left: 100%;
        transform: translate(12px,0%) scale(0.5);
        transform-origin: left bottom;
    }
    :host([placement='rightBottom']) .popover:after{
        border-right: 6px solid #fff;
        left: -12px;
        bottom: 10px;
        transform: translate(0px,0);
    }
    :host([placement='rightBottom']:not([trigger]):hover)  .popover, 
    :host([placement='rightBottom'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        bottom: 0;
        transform: translate(12px,0%) scale(1);
    }
    :host([placement='rightBottom'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(12px,0%) scale(1);
    }
    
    :host([placement='bottomLeft']) .popover{
        bottom: 0;
        /*left: 0;*/
        left: 8px;
        right: 0;
        transform: translate(0,calc(100% + 12px)) scale(0.5);
        transform-origin: top left;
    }
    :host([placement='bottomLeft']) .popover:after{
        bottom: calc(100%);
        transform: translate(0%,0%);
        left: 0;
    }
    :host([placement='bottomLeft']:not([trigger]):hover)  .popover, 
    :host([placement='bottomLeft'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(100% + 12px)) scale(1);
    }
    :host([placement='bottomLeft'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(100% + 12px)) scale(1);
    }
    :host([placement='bottom']) .popover{
        bottom: 0;
        left: 50%;
        right: 0;
        transform: translate(-50%,calc(100% + 12px)) scale(0.5);
        transform-origin: top center;
    }
    :host([placement='bottom']) .popover:after{
        border-bottom: 6px solid #fff;
        bottom: calc(100%);
        transform: translate(-50%,0%);
        left: 50%;
    }
    :host([placement='bottom']:not([trigger]):hover)  .popover, 
    :host([placement='bottom'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-50%,calc(100% + 12px)) scale(1);
    }
    :host([placement='bottom'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(-50%,calc(100% + 12px)) scale(1);
    }
    /*bottomRight*/
    :host([placement='bottomRight']) .popover{
        bottom: 0;
        right: 0;
        transform: translate(0%,calc(100% + 12px)) scale(0.5);
        transform-origin: top right;
    }
    :host([placement='bottomRight']) .popover:after{
        border-bottom: 6px solid #fff;
        bottom: calc(100%);
        transform: translate(-50%,0%);
        right: 10px;
    }
    :host([placement='bottomRight']:not([trigger]):hover)  .popover, 
    :host([placement='bottomRight'][trigger='hover']:hover)  .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0,calc(100% + 12px)) scale(1);
    }
    :host([placement='bottomRight'][trigger='click']) input[type=checkbox]:checked ~ .popover { 
        visibility: visible;
        opacity: 1;
        transform: translate(0%,calc(100% + 12px)) scale(1);
    }
    :host(:not([title])) .title{
        display: none;
    }
    </style>
`;
const initHtmlStyle = (wid: string): string => {
  return replacePlaceholders(css, wid);
};

@element('lit-popover')
export class LitPopover extends BaseElement {
  static isChangeHeight: boolean = false;
  static finalHeight: number = 0;
  static get observedAttributes(): string[] {
    return ['title', 'trigger', 'width', 'placement', 'visible'];
  }

  get visible(): string {
    return this.getAttribute('visible') || 'false';
  }

  set visible(value) {
    if (value) {
      this.setAttribute('visible', 'true');
    } else {
      this.setAttribute('visible', 'false');
    }
  }

  set placement(value) {
    this.setAttribute('placement', value || 'bottomLeft');
  }

  get placement(): string | null {
    return this.getAttribute('placement');
  }

  get trigger(): string {
    return this.getAttribute('trigger') || 'hover';
  }

  set trigger(value) {
    this.setAttribute('trigger', value);
  }

  get title(): string {
    return this.getAttribute('title') || '';
  }

  set title(value: string) {
    this.setAttribute('title', value);
  }

  get width(): string {
    return this.getAttribute('width') || 'max-content';
  }

  set width(value) {
    this.setAttribute('width', value);
  }

  get haveRadio(): string | null {
    return this.getAttribute('haveRadio');
  }

  get haveCheckbox(): string | null {
    return this.getAttribute('haveCheckbox');
  }

  initElements(): void {}

  initHtml(): string {
    return `
        ${initHtmlStyle(this.width)}
        <input class="trigger-click" type="checkbox">
        <div class="popover" title="">
            <div class="title">${this.title}</div>
            <div class="content"><slot name="content" ></slot></div>
        </div>
        <slot></slot>
        `;
  }

  connectedCallback(): void {
    let popover: unknown = this.shadowRoot!.querySelector('.popover');
    let checkbox: unknown = this.shadowRoot!.querySelector('.trigger-click');
    let sp = document.querySelector("body > sp-application")?.shadowRoot?.querySelector("#sp-system-trace") as SpSystemTrace;
    let favoriteList = sp.shadowRoot?.querySelector("#favorite-chart-list") as SpChartList;
    this.setAttribute('tabindex', '1'); // @ts-ignore
    popover.onclick = (e: unknown): void => {
      // @ts-ignore
      e.stopPropagation();
    }; // @ts-ignore
    popover.addEventListener('mousemove', (e: unknown) => {
      // @ts-ignore
      e.stopPropagation();
    });
    this.onclick = (e: unknown): void => {
      // @ts-ignore
      e.stopPropagation(); // @ts-ignore
      if (e.relatedTarget?.hasAttribute('not-close')) {
        this.focus();
      } // @ts-ignore
      checkbox.checked = !checkbox.checked; // @ts-ignore
      if (!this.haveCheckbox) {
        // @ts-ignore
        this.visible = checkbox.checked;
      }
      if (sp.collectRows && sp.collectRows.length) {
        let isHiperf = sp.collectRows.some((row) => {
          return row.rowId === 'HiPerf-callchart' && row.rowParentId === 'HiPerf';
        });
        let rowHeight = sp.collectRows.reduce((pre, row) => {
          let height = row._frame?.height;
          return pre + height!;
        }, 0);
        let titleHeight = sp.groupTitle1!.clientHeight || sp.groupTitle2!.clientHeight;
        if (sp.collectEl1!.innerHTML.trim() !== '' && sp.collectEl2!.innerHTML.trim() !== '') {
          titleHeight = titleHeight * 2;
        }
        let favoriteListHeight = favoriteList!.clientHeight * dpr();
        let finalHeight = rowHeight + titleHeight > favoriteListHeight ? favoriteListHeight : rowHeight + titleHeight;
        let isResetHeight = parseFloat(favoriteList.style.height.replace('px', '')) >= 300 && finalHeight >= 300;
        favoriteList.style.height = this.visible === 'true' && isHiperf && !isResetHeight ? '300px' : `${finalHeight}px`;
        LitPopover.isChangeHeight = this.visible === 'true' && isHiperf && !isResetHeight ? true : false;
        LitPopover.finalHeight = finalHeight;
      }
    }; // @ts-ignore
    popover.onmouseleave = (): void => {
      this.focus();
      if (this.haveCheckbox) {
        // @ts-ignore
        this.visible = false;
      }
    };
    this.onblur = (ev: unknown): void => {
      // @ts-ignore
      if (ev.relatedTarget && this.haveRadio) {
        // @ts-ignore
        if (ev.relatedTarget.hasAttribute('not-close')) {
          // @ts-ignore
        } else if (ev.relatedTarget.type === 'radio') {
          this.focus();
        } else {
          // @ts-ignore
          this.visible = false;
        }
      // @ts-ignore
      } else if (this.haveCheckbox) {
      } else {
        // @ts-ignore
        this.visible = false;
      }
    };
  }

  disconnectedCallback(): void {}

  adoptedCallback(): void {}

  attributeChangedCallback(name: unknown, oldValue: unknown, newValue: unknown): void {
    if (name === 'visible') {
      if (newValue === 'false') {
        // @ts-ignore
        this.shadowRoot!.querySelector('.trigger-click')!.checked = false;
      } else {
        // @ts-ignore
        this.shadowRoot!.querySelector('.trigger-click')!.checked = true;
      }
    }
  }
}
