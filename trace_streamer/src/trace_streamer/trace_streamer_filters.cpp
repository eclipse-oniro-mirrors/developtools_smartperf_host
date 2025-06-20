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

#include "trace_streamer_filters.h"
#include "animation_filter.h"
#include "app_start_filter.h"
#include "args_filter.h"
#include "binder_filter.h"
#include "clock_filter_ex.h"
#include "cpu_filter.h"
#include "filter_filter.h"
#include "frame_filter.h"
#ifdef ENABLE_HISYSEVENT
#include "hi_sysevent_measure_filter.h"
#endif
#include "irq_filter.h"
#include "measure_filter.h"
#include "perf_data_filter.h"
#include "process_filter.h"
#include "slice_filter.h"
#include "stat_filter.h"
#include "syscall_filter.h"
#include "system_event_measure_filter.h"
#include "task_pool_filter.h"

namespace SysTuning {
namespace TraceStreamer {
TraceStreamerFilters::TraceStreamerFilters() = default;
TraceStreamerFilters::~TraceStreamerFilters() = default;
void TraceStreamerFilters::FilterClear()
{
    binderFilter_->Clear();
    sliceFilter_->Clear();
    cpuFilter_->Clear();
    irqFilter_->Clear();
    frameFilter_->Clear();
    syscallFilter_->Clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
