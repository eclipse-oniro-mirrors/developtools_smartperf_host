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

#include "demo_trace_data_cache_writer.h"
#include "log.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace TraceStdtype;
DemoTraceDataCacheWriter::~DemoTraceDataCacheWriter() {}

GpuCounter *DemoTraceDataCacheWriter::GetGpuCounterData()
{
    return &gpuCounter_;
}
GpuCounterObject *DemoTraceDataCacheWriter::GetGpuCounterObjectData()
{
    return &gpuCounterObject_;
}
SliceObject *DemoTraceDataCacheWriter::GetSliceObjectData()
{
    return &sliceObject_;
}
SliceData *DemoTraceDataCacheWriter::GetSliceTableData()
{
    return &sliceData_;
}
MetaData *DemoTraceDataCacheWriter::GetMetaData()
{
    return &metaData_;
}
void DemoTraceDataCacheWriter::MixTraceTime(uint64_t timestampMin, uint64_t timestampMax)
{
    if (timestampMin == std::numeric_limits<uint64_t>::max() || timestampMax == 0) {
        return;
    }
    if (traceStartTime_ != std::numeric_limits<uint64_t>::max()) {
        traceStartTime_ = std::max(traceStartTime_, timestampMin);
    } else {
        traceStartTime_ = timestampMin;
    }
    if (traceEndTime_) {
        traceEndTime_ = std::min(traceEndTime_, timestampMax);
    } else {
        traceEndTime_ = timestampMax;
    }
}
void DemoTraceDataCacheWriter::Clear()
{
    gpuCounter_.Clear();
    gpuCounterObject_.Clear();
    sliceObject_.Clear();
    sliceData_.Clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
