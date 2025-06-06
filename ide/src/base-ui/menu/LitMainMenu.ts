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
import './LitMainMenuItem';
import './LitMainMenuGroup';
import { LitMainMenuGroup } from './LitMainMenuGroup';
import { LitMainMenuItem } from './LitMainMenuItem';

const initHtmlStyle: string = `
    <style>
        :host{
            width: 248px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: #fff;
        }
        .menu-body ::-webkit-scrollbar-thumb
        {
            background-color: var(--dark-background,#FFFFFF);
            border-radius:10px;

        }
        .menu-body ::-webkit-scrollbar-track
        {
            border-radius:10px;
            background-color:#F5F5F5;
            
        }
        .header{
            display: grid;
            width: 100%;
            height: 56px;
            padding-left: 24px;
            gap: 0 14px;
            box-sizing: border-box;
            grid-template-columns: min-content 1fr min-content;
            grid-template-rows: auto;
            color: #47A7E0;
            background-color: var(--dark-background1);
            border-bottom: 1px solid var(--dark-background1,#EFEFEF);
            align-self: center;
        }
        .logo-img{
          width: 32px;
          height: 32px;
          vertical-align: middle;
        }
        .logo-text{
          font-family: 鸿蒙;
          font-size: 20px;
          color: #1E4EEA;
        }
        .bottom{
            width: 100%;
            display: flex;
            justify-content: space-between;
        }
        .header *{
            user-select: none;
            align-self: center;
        }
        .version{
            width: 15rem;
            padding: 20px 0;
            text-align: center;
            color: #94979d;
            font-size: 0.6rem;
        }
        .color, .customColor{
            cursor: pointer;
            font-size: 0.6rem;
            padding: 20px 0px 20px 20px;
        }
        *{
            box-sizing: border-box;
        }
        .menu-button{
            display: flex;
            align-content: center;
            justify-content: center;
            cursor: pointer;
            height: 47px;
            width: 48px;
            color: #1E4EEA;
        }
        </style>
    `;

@element('lit-main-menu')
export class LitMainMenu extends BaseElement {
  private slotElements: Element[] | undefined;
  private _menus: Array<MenuGroup> | undefined;

  static get observedAttributes(): string[] {
    return [];
  }

  get menus(): Array<MenuGroup> | undefined {
    return this._menus;
  }

  set menus(value: Array<MenuGroup> | undefined) {
    this._menus = value;
    this.shadowRoot?.querySelectorAll('lit-main-menu-group').forEach((a) => a.remove());
    let menuBody = this.shadowRoot?.querySelector('.menu-body');
    if (this.getAttribute('main_menu') === '1' && window.localStorage.getItem('Theme') === 'dark') {
      this.style.backgroundColor = '#262f3c';
    } else {
      this.style.backgroundColor = '#fff';
    }
    value?.forEach((it) => {
      let group: LitMainMenuGroup = new LitMainMenuGroup();
      group.setAttribute('title', it.title || '');
      if (it.describe !== '') {
        group.setAttribute('describe', it.describe || '');
      } else {
        group.removeAttribute('describe');
      }
      group.setAttribute('icon', it.icon || '');
      if (it.collapsed) {
        group.setAttribute('collapsed', '');
      } else {
        group.removeAttribute('collapsed');
      }
      let groupName: LitMainMenuGroup = group!.shadowRoot!.querySelector('.group-name') as LitMainMenuGroup;
      let groupDescribe: LitMainMenuGroup = group!.shadowRoot!.querySelector('.group-describe') as LitMainMenuGroup;
      menuBody?.appendChild(group); // @ts-ignore
      it.children?.forEach((item: unknown) => {
        // @ts-ignore
        if (item.fileModel !== undefined && item.fileModel === 'db') {
          return;
        } // @ts-ignore
        if (item.children && item.children.length > 0) {
          let secondGroup: LitMainMenuGroup = new LitMainMenuGroup(); // @ts-ignore
          secondGroup.setAttribute('title', item.title || ''); // @ts-ignore
          if (item.describe !== '') {
            // @ts-ignore
            secondGroup.setAttribute('describe', item.describe || '');
          } else {
            secondGroup.removeAttribute('describe');
          }
          this.setChildren(item, group, groupName, groupDescribe, secondGroup);
        } else {
          this.notChildren(item, group, groupName, groupDescribe);
        }
      });
    });
  }

  setChildren(
    item: unknown,
    group: LitMainMenuGroup,
    groupName: LitMainMenuGroup,
    groupDescribe: LitMainMenuGroup,
    secondGroup: LitMainMenuGroup
  ): void {
    // @ts-ignore
    secondGroup.setAttribute('icon', item.icon || ''); // @ts-ignore
    if (item.second) {
      secondGroup.setAttribute('second', '');
    } else {
      secondGroup.removeAttribute('second');
    } // @ts-ignore
    if (item.collapsed) {
      secondGroup.setAttribute('collapsed', '');
    } else {
      secondGroup.removeAttribute('collapsed');
    }
    group?.appendChild(secondGroup); // @ts-ignore
    item.children?.forEach((v: unknown) => {
      let th = new LitMainMenuItem(); // @ts-ignore
      th.setAttribute('icon', v.icon || ''); // @ts-ignore
      th.setAttribute('title', v.title || '');
      if (this.getAttribute('main_menu') === '1' && window.localStorage.getItem('Theme') === 'dark') {
        groupName.style.color = 'white';
        groupDescribe.style.color = 'white';
        th!.style.color = 'white';
      } else {
        groupName.style.color = 'black';
        groupDescribe.style.color = 'black';
        th!.style.color = 'black';
      } // @ts-ignore
      if (v.fileChoose) {
        th.setAttribute('file', '');
        th.addEventListener('file-change', (e): void => {
          // @ts-ignore
          if (v.fileHandler && !th.disabled) { // @ts-ignore
            v.fileHandler(e);
          }
        });
      } else {
        th.removeAttribute('file');
        th.addEventListener('click', (e): void => {
          // @ts-ignore
          if (v.clickHandler && !th.disabled) { // @ts-ignore
            v.clickHandler(v);
          }
        });
      } // @ts-ignore
      if (v.disabled !== undefined) { // @ts-ignore
        th.disabled = v.disabled;
      }
      secondGroup.appendChild(th);
    });
  }

  notChildren(
    item: unknown,
    group: LitMainMenuGroup,
    groupName: LitMainMenuGroup,
    groupDescribe: LitMainMenuGroup
  ): void {
    let th = new LitMainMenuItem(); // @ts-ignore
    th.setAttribute('icon', item.icon || ''); // @ts-ignore
    th.setAttribute('title', item.title || '');
    if (this.getAttribute('main_menu') === '1' && window.localStorage.getItem('Theme') === 'dark') {
      groupName.style.color = 'white';
      groupDescribe.style.color = 'white';
      th!.style.color = 'white';
    } else {
      groupName.style.color = 'black';
      groupDescribe.style.color = 'black';
      th!.style.color = 'black';
    } // @ts-ignore
    if (item.fileChoose) {
      th.setAttribute('file', '');
      th.addEventListener('file-change', (e) => {
        // @ts-ignore
        if (item.fileHandler && !th.disabled) {
          // @ts-ignore
          item.fileHandler(e);
        }
      });
    } else {
      th.removeAttribute('file');
      th.addEventListener('click', (e) => {
        // @ts-ignore
        if (item.clickHandler && !th.disabled) {
          // @ts-ignore
          item.clickHandler(item);
        }
      });
    }
    // @ts-ignore
    if (item.multi) {
      th.multi = true;
    }
    // @ts-ignore
    if (item.disabled !== undefined) {
      // @ts-ignore
      th.disabled = item.disabled;
    }
    group?.appendChild(th);
  }

  initElements(): void {
    let st: HTMLSlotElement | null | undefined = this.shadowRoot?.querySelector('#st');
    st?.addEventListener('slotchange', (e) => {
      this.slotElements = st?.assignedElements();
      this.slotElements?.forEach((it) => {
        it.querySelectorAll('lit-main-menu-item').forEach((cell) => {});
      });
    });
    let versionDiv: HTMLElement | null | undefined = this.shadowRoot?.querySelector<HTMLElement>('.version');
    //@ts-ignore
    versionDiv!.innerText = window.version || '';
  }

  initHtml(): string {
    return `
        ${initHtmlStyle}
        <div class="header" name="header">
            <img class="logo-img" src="img/logo.png"/>
            <span class="logo-text">
              HiSmartPerf
            </span>
            <div class="menu-button">
                <lit-icon name="menu" size="20" color="var(blue,#4D4D4D)"></lit-icon>
            </div>
        </div>
        <div class="menu-body" style="overflow: auto;overflow-x:hidden;height: 100%">
            <slot id="st" ></slot>
        </div>
        <div class="bottom">
             <div class="customColor">
                <lit-icon name="bg-colors" size="20" color="grey"></lit-icon>
             </div>
             <img class="ai_analysis" title="AI Assistant" src="img/ai-analysis.png" style="margin-left: 0.8em;width:16px;height:16px;margin-top: 1.4em;cursor: pointer;">
             <div class="version" style="">
             </div>
             <div class='extend_connect' style="background-color:red;width: 15px; height: 10px; border-radius: 100%; margin-top: 22px; margin-right: 20px;"></div>
        </div>`;
  }
}

export interface MenuGroup {
  title: string;
  describe: string;
  second: boolean;
  collapsed: boolean;
  children: MenuItem[];
  icon: string;
}

export interface MenuItem {
  icon: string;
  title: string;
  fileModel?: string;
  multi?: boolean;
  disabled?: boolean;
  fileChoose?: boolean;
  clickHandler?: Function;
  fileHandler?: Function;
}
