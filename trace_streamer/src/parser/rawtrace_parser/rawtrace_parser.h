/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef RAWTRACE_PARSER_H
#define RAWTRACE_PARSER_H
#include "common_types.h"
#include "cpu_detail_parser.h"
#include "parser_base.h"
#include "ftrace_processor.h"
#include "kernel_symbols_processor.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class RawTraceParser : public ParserBase {
public:
    RawTraceParser(TraceDataCache* dataCache, const TraceStreamerFilters* filters);
    ~RawTraceParser();
    void ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish = false) override;
    void WaitForParserEnd();

private:
    bool ParseDataRecursively(std::deque<uint8_t>::iterator& packagesCurIter);
    void ParseTraceDataItem(const std::string& buffer) override;
    bool ParseCpuRawData(uint32_t cpuId, const std::string& buffer);
    bool HmParseCpuRawData(const std::string& buffer);
    bool ParseLastCommData(uint8_t type, const std::string& buffer);
    bool InitRawTraceFileHeader(std::deque<uint8_t>::iterator& packagesCurIter);
    bool InitEventFormats(const std::string& buffer);
    bool UpdateCpuCoreMax(uint32_t cpuId);
    void UpdateTraceMinRange();

private:
    std::unique_ptr<FtraceCpuDetailMsg> cpuDetail_ = nullptr;
    std::unique_ptr<CpuDetailParser> cpuDetailParser_ = nullptr;
    std::unique_ptr<FtraceProcessor> ftraceProcessor_ = nullptr;
    std::unique_ptr<KernelSymbolsProcessor> ksymsProcessor_ = nullptr;
    TraceDataCache* traceDataCache_;
    bool hasGotHeader_ = false;
    uint8_t fileType_ = 0;
    uint8_t restCommDataCnt_ = 0;
    uint32_t cpuCoreMax_ = 0;
    const std::string eventEndCmd_ = "print fmt:";
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // RAWTRACE_PARSER_H_
