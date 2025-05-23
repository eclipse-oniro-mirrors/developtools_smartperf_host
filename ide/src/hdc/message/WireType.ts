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

export class WireType {
  static VARINT: number = 0; //uint32
  static FIXED64: number = 1; //uint32
  static LENGTH_DELIMETED: number = 2; //uint32
  static START_GROUP: number = 3; //uint32
  static END_GROUP: number = 4; //uint32
  static FIXED32: number = 5; //uint32
}
