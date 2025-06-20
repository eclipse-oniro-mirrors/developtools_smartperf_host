/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
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

#ifndef SYSCALL_FILTER_H
#define SYSCALL_FILTER_H

#include <unordered_map>
#include <unordered_set>

#include "clock_filter_ex.h"
#include "common_types.h"
#include "filter_base.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;
class SyscallFilter : private FilterBase {
public:
    SyscallFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ~SyscallFilter() override;
    void UpdataSyscallEnterExitMap(const SyscallInfoRow &syscallInfoRow);
    void AppendSysCallInfo(uint32_t pid, uint32_t syscallNr, uint64_t ts, int64_t ret);
    void Clear();

private:
    std::map<std::pair<uint32_t /*itid*/, uint32_t /*sysCallId*/>, SyscallInfoRow> syscallEnterExitMap_;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // SYSCALL_FILTER_H
