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

#ifndef TRACE_STREAMERTOKEN_H
#define TRACE_STREAMERTOKEN_H

#include <memory>
namespace SysTuning {
namespace TraceStreamer {
class AnimationFilter;
class SliceFilter;
class ProcessFilter;
class CpuFilter;
class MeasureFilter;
class FilterFilter;
class ClockFilterEx;
class StatFilter;
class BinderFilter;
class ArgsFilter;
class IrqFilter;
class SyscallFilter;
class SystemEventMeasureFilter;
class ConfigFilter;
#ifdef ENABLE_HISYSEVENT
class HiSysEventMeasureFilter;
#endif
class FrameFilter;
class APPStartupFilter;
class TaskPoolFilter;
#ifdef ENABLE_HIPERF
class PerfDataFilter;
#endif
class TraceStreamerFilters {
public:
    TraceStreamerFilters();
    ~TraceStreamerFilters();
    void FilterClear();
    std::unique_ptr<AnimationFilter> animationFilter_;
    std::unique_ptr<ClockFilterEx> clockFilter_;
    std::unique_ptr<FilterFilter> filterFilter_;
    std::unique_ptr<SliceFilter> sliceFilter_;
    std::unique_ptr<ProcessFilter> processFilter_;
    std::unique_ptr<CpuFilter> cpuFilter_;
    std::unique_ptr<MeasureFilter> measureFilter_;
    std::unique_ptr<StatFilter> statFilter_;
    std::unique_ptr<BinderFilter> binderFilter_;
    std::unique_ptr<ArgsFilter> argsFilter_;
    std::unique_ptr<IrqFilter> irqFilter_;
    std::unique_ptr<SyscallFilter> syscallFilter_;
    std::unique_ptr<SystemEventMeasureFilter> sysEventMemMeasureFilter_;
    std::unique_ptr<SystemEventMeasureFilter> sysEventVMemMeasureFilter_;
    std::unique_ptr<SystemEventMeasureFilter> sysEventSourceFilter_;
    std::unique_ptr<ConfigFilter> configFilter_;
#ifdef ENABLE_HISYSEVENT
    std::unique_ptr<HiSysEventMeasureFilter> hiSysEventMeasureFilter_;
#endif
    std::unique_ptr<FrameFilter> frameFilter_;
    std::unique_ptr<APPStartupFilter> appStartupFilter_;
    std::unique_ptr<TaskPoolFilter> taskPoolFilter_;
#ifdef ENABLE_HIPERF
    std::unique_ptr<PerfDataFilter> perfDataFilter_;
#endif
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // TRACE_STREAMERTOKEN_H
