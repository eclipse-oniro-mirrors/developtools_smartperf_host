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

#ifndef BYTRACE_PARSER_H
#define BYTRACE_PARSER_H

#include <condition_variable>
#include <mutex>
#include <regex>
#include <thread>

#include "bytrace_event_parser.h"
#include "bytrace_hilog_parser.h"
#include "bytrace_hisysevent_parser.h"
#include "log.h"
#include "parser_base.h"
#include "string_to_numerical.h"
#include "trace_data/trace_data_cache.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
constexpr int32_t DETERMINE_CONTINUE = 2;
constexpr int32_t DETERMINE_RETURN = 3;
class BytraceParser : public ParserBase {
public:
    BytraceParser(TraceDataCache* dataCache,
                  const TraceStreamerFilters* filters,
                  TraceFileType fileType = TRACE_FILETYPE_BY_TRACE);
    ~BytraceParser();

    template <typename Iterator>
    int32_t WhileDetermine(Iterator& determine, Iterator& packagesBegin, bool& isParsingOver_, bool isFinish);
    int32_t GotoDetermine(std::string& bufferLine, bool& haveSplitSeg);

    void ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish = false) override;
    size_t ParsedTraceValidLines() const
    {
        return parsedTraceValidLines_;
    }
    size_t ParsedTraceInvalidLines() const
    {
        return parsedTraceInvalidLines_;
    }
    size_t TraceCommentLines() const
    {
        return traceCommentLines_;
    }
    void EnableBytrace(bool enable)
    {
        isBytrace_ = enable;
    }
    int32_t MinSplitPos()
    {
        return minSplitPos_;
    }
    int32_t MaxSplitPos()
    {
        return maxSplitPos_;
    }
    const auto& GetTraceDataBytrace()
    {
        return mTraceDataBytrace_;
    }
    void ClearByTraceData()
    {
        mTraceDataBytrace_.clear();
        curFileOffset_ = 0;
        curDataSize_ = 0;
        minSplitPos_ = INVALID_INT32;
        maxSplitPos_ = INVALID_INT32;
        isParsingOver_ = false;
    }
    auto GetHiLogParser()
    {
        return hilogParser_.get();
    }

    void WaitForParserEnd();

private:
    int32_t GetNextSegment();
    void GetDataSegAttr(DataSegment& seg, const std::smatch& matcheLine) const;

    void FilterThread();
    inline static bool IsNotSpace(char c)
    {
        return !std::isspace(c);
    }
    inline static bool IsTraceComment(const std::string& buffer)
    {
        return ((buffer[0] == '#') || buffer.find("TASK-PID") != std::string::npos);
    }
    inline static bool IsHtmlTrace(const std::string& buffer)
    {
        std::string lower(buffer);
        transform(buffer.begin(), buffer.end(), lower.begin(), ::tolower);
        return ((lower.compare(0, std::string("<!doctype html>").length(), "<!doctype html>") == 0) ||
                (lower.compare(0, std::string("<html>").length(), "<html>") == 0));
    }
    inline static bool IsHtmlTraceBegin(const std::string& buffer)
    {
        return buffer.find(R"(<script class="trace-data" type="application/text">)") != std::string::npos;
    }

    void ParseTraceDataItem(const std::string& buffer) override;
    std::string StrTrim(const std::string& input) const;
    void ParseThread();
    void ParserData(DataSegment& seg);
    bool FilterData(DataSegment& seg);
    bool UpdateSplitPos();

private:
    TraceFileType fileType_ = TRACE_FILETYPE_BY_TRACE;
    TraceDataCache* traceDataCache_;
    std::unique_ptr<BytraceEventParser> eventParser_;
    std::unique_ptr<BytraceHilogParser> hilogParser_;
    std::unique_ptr<BytraceHiSysEventParser> hiSysEventParser_;
    bool isParsingOver_ = false;
    const std::regex bytraceMatcher_ = std::regex(R"(-(\d+)\s+\(?\s*(\d+|-+)?\)?\s?\[(\d+)\]\s*)"
                                                  R"([a-zA-Z0-9.]{0,5}\s+(\d+\.\d+):\s+(\S+):)");
    const std::string script_ = R"(</script>)";
    size_t parsedTraceValidLines_ = 0;
    size_t parsedTraceInvalidLines_ = 0;
    size_t traceCommentLines_ = 0;
    std::mutex dataSegMux_;
    int32_t parseHead_ = 0;
    std::atomic<bool> filterThreadStarted_{false};
    bool parseThreadStarted_ = false;
    const int32_t maxSegArraySize = 5000;
    const int32_t maxThread_ = 4; // 4 is the best on ubuntu 113MB/s, max 138MB/s, 6 is best on mac m1 21MB/s,
    int32_t parserThreadCount_ = 0;
    bool toExit_ = false;
    bool exited_ = false;
    std::unique_ptr<DataSegment[]> dataSegArray_;
    int32_t rawDataHead_ = 0;
    int32_t filterHead_ = 0;
    const int32_t sleepDur_ = 100;
    bool isBytrace_ = true;
    bool traceBegan_ = false;
    bool isFirstLine_ = true;
    bool isHtmlTrace_ = false;
    bool isHtmlTraceContent_ = false;
    int64_t seq_ = 1;
    uint64_t curFileOffset_ = 0;
    uint32_t curDataSize_ = 0;
    int32_t minSplitPos_ = INVALID_INT32;
    int32_t maxSplitPos_ = INVALID_INT32;
    std::deque<std::pair<int32_t /* offset */, int32_t /* size */>> mTraceDataBytrace_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // _BYTRACE_PARSER_H_
