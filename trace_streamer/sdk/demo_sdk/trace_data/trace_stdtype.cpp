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

#include "trace_stdtype.h"
#include <algorithm>
#include <ctime>
namespace SysTuning {
namespace TraceStdtype {

void GpuCounter::AppendNewData(uint64_t ts, int32_t counterId, int32_t value)
{
    ts_.emplace_back(ts);
    counterId_.emplace_back(counterId);
    value_.emplace_back(value);
    demoIds_.push_back(counterId_.size() - 1);
}
const std::deque<uint64_t> &GpuCounter::TimeStamp() const
{
    return ts_;
}
const std::deque<int32_t> &GpuCounter::CounterId() const
{
    return counterId_;
}
const std::deque<int32_t> &GpuCounter::Value() const
{
    return value_;
}

void GpuCounterObject::AppendNewData(int32_t counterId, const std::string counterName)
{
    counterId_.emplace_back(counterId);
    counterName_.emplace_back(counterName);
    demoIds_.push_back(counterId_.size() - 1);
}
const std::deque<int32_t> &GpuCounterObject::CounterId() const
{
    return counterId_;
}
const std::deque<std::string> &GpuCounterObject::CounterName() const
{
    return counterName_;
}
void SliceObject::AppendNewData(int32_t sliceId, std::string sliceName)
{
    sliceId_.emplace_back(sliceId);
    sliceName_.emplace_back(sliceName);
    demoIds_.push_back(sliceId_.size() - 1);
}
const std::deque<int32_t> &SliceObject::SliceId() const
{
    return sliceId_;
}
const std::deque<std::string> &SliceObject::SliceName() const
{
    return sliceName_;
}
void SliceData::AppendNewData(int32_t sliceId, uint64_t startTs, uint64_t endTs, int32_t value)
{
    startTs_.emplace_back(startTs);
    endTs_.emplace_back(endTs);
    sliceId_.emplace_back(sliceId);
    value_.emplace_back(value);
    demoIds_.push_back(sliceId_.size() - 1);
}
const std::deque<int32_t> &SliceData::SliceId() const
{
    return sliceId_;
}
const std::deque<uint64_t> &SliceData::TimeStamp() const
{
    return startTs_;
}
const std::deque<uint64_t> &SliceData::EndTs() const
{
    return endTs_;
}
const std::deque<int32_t> &SliceData::Value() const
{
    return value_;
}
void MetaData::InitMetaData()
{
    columnNames_.resize(METADATA_ITEM_MAX);
    values_.resize(METADATA_ITEM_MAX);
    columnNames_[METADATA_ITEM_PARSERTOOL_VERSION] = METADATA_ITEM_PARSERTOOL_VERSION_COLNAME;
    columnNames_[METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME] = METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME_COLNAME;
}
void MetaData::SetParserToolVersion(const std::string &version)
{
    values_[METADATA_ITEM_PARSERTOOL_VERSION] = version;
}
void MetaData::SetParserToolPublishDateTime(const std::string &datetime)
{
    values_[METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME] = datetime;
}
const std::string &MetaData::Value(uint64_t row) const
{
    return values_[row];
}
const std::string &MetaData::Name(uint64_t row) const
{
    return columnNames_[row];
}

} // namespace TraceStdtype
} // namespace SysTuning
