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

import { LitIcon } from '../../../src/base-ui/icon/LitIcon';

describe('testLitIcon Test', () => {
  it('testLitIcon01', () => {
    let litIcon = new LitIcon();
    expect(litIcon).not.toBeUndefined();
    expect(litIcon).not.toBeNull();
  });

  it('testLitIcon02', () => {
    let litIcon = new LitIcon();
    expect(litIcon.path).toBeUndefined();
  });

  it('testLitIcon03', () => {
    let litIcon = new LitIcon();
    litIcon.path = 'ss';
    expect(litIcon.path).toBeUndefined();
  });

  it('testLitIcon04', () => {
    let litIcon = new LitIcon();
    expect(litIcon.size).toBe(0);
  });

  it('testLitIcon05', () => {
    let litIcon = new LitIcon();
    litIcon.size = 1024;
    expect(litIcon.size).toBe(1024);
  });

  it('testLitIcon06', () => {
    let litIcon = new LitIcon();
    expect(litIcon.name).toBe('');
  });

  it('testLitIcon07', () => {
    let litIcon = new LitIcon();
    litIcon.name = 'sss';
    expect(litIcon.name).toBe('sss');
  });

  it('testLitIcon07', () => {
    let litIcon = new LitIcon();
    expect((litIcon.color = '#FFF')).not.toBeUndefined();
  });
});
