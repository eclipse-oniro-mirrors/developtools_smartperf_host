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

#include "ptreader_hisysevent_parser.h"

namespace SysTuning {
namespace TraceStreamer {
PtreaderHiSysEventParser::PtreaderHiSysEventParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters)
    : EventParserBase(dataCache, filters)
{
}

PtreaderHiSysEventParser::~PtreaderHiSysEventParser() = default;
void PtreaderHiSysEventParser::ParseHiSysEventDataItem(const std::string &buffer,
                                                       const uint64_t lineSeq,
                                                       bool &haveSplitSeg)
{
    json jMessage;
    if (!jMessage.accept(buffer)) {
        return;
    }
    jMessage = json::parse(buffer);
    streamFilters_->hiSysEventMeasureFilter_->FilterAllHiSysEvent(jMessage, lineSeq, haveSplitSeg);
    return;
}
void PtreaderHiSysEventParser::Finish()
{
    auto startTime = streamFilters_->hiSysEventMeasureFilter_->GetPluginStartTime();
    if (startTime != INVALID_UINT64) {
        traceDataCache_->UpdateTraceTime(startTime);
    }
    auto endTime = streamFilters_->hiSysEventMeasureFilter_->GetPluginEndTime();
    if (endTime != INVALID_UINT64) {
        traceDataCache_->UpdateTraceTime(endTime);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
