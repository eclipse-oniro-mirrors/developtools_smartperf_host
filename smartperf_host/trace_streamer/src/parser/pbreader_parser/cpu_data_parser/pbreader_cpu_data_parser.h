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
#ifndef HTRACE_CPU_DATA_PARSER_H
#define HTRACE_CPU_DATA_PARSER_H
#include <cstdint>
#include <map>
#include <string>
#include "cpu_plugin_result.pbreader.h"
#include "event_parser_base.h"
#include "htrace_plugin_time_parser.h"
#include "trace_data_cache.h"
#include "trace_streamer_config.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
class PbreaderCpuDataParser : public EventParserBase, public HtracePluginTimeParser {
public:
    PbreaderCpuDataParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~PbreaderCpuDataParser();
    void Parse(ProtoReader::BytesView tracePacket, uint64_t ts);
    void Finish();
    enum TSCpuDataType { TS_CPU_DATA_TYPE_USAGE, TS_CPU_DATA_TYPE_THREAD_INFO, TS_CPU_DATA_TYPE_LOAD };
    class TsCpuData {
    public:
        TsCpuData()
        {
            ts_ = 0;
            cpuDataType_ = TS_CPU_DATA_TYPE_USAGE;
        }
        void SetCpuUsage(uint64_t ts)
        {
            ts_ = ts;
            cpuDataType_ = TS_CPU_DATA_TYPE_USAGE;
        }
        void SetThreadInfo(uint64_t ts)
        {
            ts_ = ts;
            cpuDataType_ = TS_CPU_DATA_TYPE_THREAD_INFO;
        }
        void SetExtInfo(double totalLoad, double userLoad, double sysLoad, double processNum)
        {
            totalLoad_ = totalLoad;
            userLoad_ = userLoad;
            sysLoad_ = sysLoad;
            processNum_ = processNum;
            cpuDataType_ = TS_CPU_DATA_TYPE_LOAD;
        }
        uint64_t ts_;
        TSCpuDataType cpuDataType_;
        double userLoad_ = 0;
        double sysLoad_ = 0;
        double processNum_ = 0;
        double totalLoad_ = 0;
    };
    std::vector<std::unique_ptr<TsCpuData>> cpuData_;

private:
    std::string threadStateDesc_[ProtoReader::THREAD_WAITING + 1] = {"undefined", "Running", "Sleep", "Sloped",
                                                                     "Watting"};
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // HTRACE_CPU_DATA_PARSER_H
