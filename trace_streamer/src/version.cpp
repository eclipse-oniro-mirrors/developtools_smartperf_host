/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include "version.h"
namespace SysTuning {
namespace TraceStreamer {
size_t g_loadSize = 0;
size_t g_fileSize = 0;
const std::string TRACE_STREAMER_VERSION = "4.3.4";            // version
const std::string TRACE_STREAMER_PUBLISH_VERSION = "2025/5/9"; // publish datetime
} // namespace TraceStreamer
} // namespace SysTuning
