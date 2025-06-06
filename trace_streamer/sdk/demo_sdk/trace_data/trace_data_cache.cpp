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
#include "trace_data_cache.h"
#include "sqlite3.h"
#include "../table/gpu_counter_object_table.h"
#include "../table/gpu_counter_table.h"
#include "../table/slice_object_table.h"
#include "../table/slice_table.h"

namespace SysTuning {
namespace TraceStreamer {
TraceDataCache::TraceDataCache()
{
    DemoInitDB();
}

TraceDataCache::~TraceDataCache() {}

void TraceDataCache::DemoInitDB()
{
    if (dbInited) {
        return;
    }
    dbInited = true;
}
} // namespace TraceStreamer
} // namespace SysTuning
