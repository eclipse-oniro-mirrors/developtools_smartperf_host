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

import { element } from '../../../../../base-ui/BaseElement';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { type JsCpuProfilerChartFrame } from '../../../../bean/JsStruct';
import { TabPaneJsCpuCallTree } from './TabPaneJsCpu';

@element('tabpane-js-cpu-bottom-up')
export class TabPaneJsCpuBottomUp extends TabPaneJsCpuCallTree {
  set data(data: SelectionParam | Array<JsCpuProfilerChartFrame>) {
    this.setCurrentType(this.TYPE_BOTTOM_UP);
    super.data = data;
  }
}
