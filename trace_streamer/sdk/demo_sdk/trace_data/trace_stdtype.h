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

#ifndef TRACE_STDTYPE_H
#define TRACE_STDTYPE_H

#include <array>
#include <deque>
#include <limits>
#include <map>
#include <mutex>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>
#include "ts_common.h"

namespace SysTuning {
namespace TraceStdtype {
using namespace SysTuning::TraceStreamer;
// the supported metadata
enum MetaDataItem { METADATA_ITEM_PARSERTOOL_VERSION, METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME, METADATA_ITEM_MAX };
class DemoCacheBase {
public:
    size_t Size() const
    {
        return std::max(demoTimeStamps_.size(), demoIds_.size());
    }
    const std::deque<uint64_t> &IdsData() const
    {
        return demoIds_;
    }
    const std::deque<uint64_t> &TimeStampData() const
    {
        return demoTimeStamps_;
    }
    const std::deque<InternalTid> &InternalTidsData() const
    {
        return demoInternalTids_;
    }
    virtual void Clear()
    {
        demoInternalTids_.clear();
        demoTimeStamps_.clear();
        demoIds_.clear();
    }

public:
    std::deque<InternalTid> demoInternalTids_ = {};
    std::deque<uint64_t> demoTimeStamps_ = {};
    std::deque<uint64_t> demoIds_ = {};
};

class GpuCounterObject : public DemoCacheBase {
public:
    GpuCounterObject() = default;
    ~GpuCounterObject() = default;
    void AppendNewData(int32_t counterId, const std::string counterName);
    const std::deque<int32_t> &CounterId() const;
    const std::deque<std::string> &CounterName() const;

private:
    std::deque<int32_t> counterId_ = {};
    std::deque<std::string> counterName_ = {};
};
class GpuCounter : public DemoCacheBase {
public:
    GpuCounter() = default;
    ~GpuCounter() = default;
    void AppendNewData(uint64_t ts, int32_t counterId, int32_t value);
    const std::deque<uint64_t> &TimeStamp() const;
    const std::deque<int32_t> &CounterId() const;
    const std::deque<int32_t> &Value() const;

private:
    std::deque<uint64_t> ts_ = {};
    std::deque<int32_t> counterId_ = {};
    std::deque<int32_t> value_ = {};
};

class SliceObject : public DemoCacheBase {
public:
    SliceObject() = default;
    ~SliceObject() = default;
    void AppendNewData(int32_t sliceId, std::string sliceName);
    const std::deque<int32_t> &SliceId() const;
    const std::deque<std::string> &SliceName() const;

private:
    std::deque<int32_t> sliceId_ = {};
    std::deque<std::string> sliceName_ = {};
};
class SliceData : public DemoCacheBase {
public:
    SliceData() = default;
    ~SliceData() = default;
    void AppendNewData(int32_t sliceId, uint64_t startTs, uint64_t endTs, int32_t value);
    const std::deque<int32_t> &SliceId() const;
    const std::deque<uint64_t> &TimeStamp() const;
    const std::deque<uint64_t> &EndTs() const;
    const std::deque<int32_t> &Value() const;

private:
    std::deque<uint64_t> startTs_ = {};
    std::deque<int32_t> sliceId_ = {};
    std::deque<uint64_t> endTs_ = {};
    std::deque<int32_t> value_ = {};
};
class MetaData : public DemoCacheBase {
public:
    MetaData() = default;
    ~MetaData() = default;
    void InitMetaData();
    void SetParserToolVersion(const std::string &version);
    void SetParserToolPublishDateTime(const std::string &datetime);
    const std::string &Value(uint64_t row) const;
    const std::string &Name(uint64_t row) const;
    void Clear() override
    {
        columnNames_.clear();
        values_.clear();
    }

private:
    const std::string METADATA_ITEM_PARSERTOOL_VERSION_COLNAME = "tool_version";
    const std::string METADATA_ITEM_PARSERTOOL_PUBLISH_DATETIME_COLNAME = "tool_publish_time";
    std::deque<std::string> columnNames_ = {};
    std::deque<std::string> values_ = {};
};
} // namespace TraceStdtype
} // namespace SysTuning

#endif // TRACE_STDTYPE_H
