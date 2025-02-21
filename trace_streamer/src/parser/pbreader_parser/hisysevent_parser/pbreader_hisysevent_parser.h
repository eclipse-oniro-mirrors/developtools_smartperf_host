
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

#ifndef PBREADER_HISYSEVENT_PARSER_H
#define PBREADER_HISYSEVENT_PARSER_H

#include "clock_filter_ex.h"
#include "event_parser_base.h"
#include "hi_sysevent_measure_filter.h"
#include "hisysevent_plugin_config.pbreader.h"
#include "hisysevent_plugin_result.pbreader.h"
#include "htrace_plugin_time_parser.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
class PbreaderHisyseventParser : public EventParserBase {
public:
    PbreaderHisyseventParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~PbreaderHisyseventParser();
    void Finish();
    void Parse(ProtoReader::HisyseventInfo_Reader *tracePacket, uint64_t ts, bool &haveSplitSeg);
    void Parse(ProtoReader::HisyseventConfig_Reader *tracePacket, uint64_t ts);

private:
    const uint64_t MSEC_TO_NS = 1000 * 1000;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // PBREADER_HISYSEVENT_PARSER_H
