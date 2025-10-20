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

#ifndef VERSION_H
#define VERSION_H
#include <string>
#include <sys/types.h>
namespace SysTuning {
namespace TraceStreamer {
extern size_t g_loadSize;
extern size_t g_fileSize;
extern const std::string TRACE_STREAMER_VERSION;         // version
extern const std::string TRACE_STREAMER_PUBLISH_VERSION; // publish datetime
} // namespace TraceStreamer
} // namespace SysTuning
#endif
