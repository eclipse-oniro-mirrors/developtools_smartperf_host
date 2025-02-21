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

#include "rawtrace_parser.h"
#include <cinttypes>
#if IS_WASM
#include "../rpc/wasm_func.h"
#endif
#include "log.h"
#include "string_help.h"
namespace SysTuning {
namespace TraceStreamer {
RawTraceParser::RawTraceParser(TraceDataCache* dataCache, const TraceStreamerFilters* filters)
    : ParserBase(filters),
      cpuDetail_(std::make_unique<FtraceCpuDetailMsg>()),
      cpuDetailParser_(std::make_unique<CpuDetailParser>(dataCache, filters)),
      ftraceProcessor_(std::make_unique<FtraceProcessor>()),
      ksymsProcessor_(std::make_unique<KernelSymbolsProcessor>(dataCache, filters)),
      traceDataCache_(dataCache)
{
}
RawTraceParser::~RawTraceParser() {}
void RawTraceParser::ParseTraceDataItem(const std::string& buffer) {}
void RawTraceParser::WaitForParserEnd()
{
    cpuDetailParser_->FilterAllEvents(*cpuDetail_.get(), true);
    UpdateTraceMinRange();
    restCommDataCnt_ = 0;
    hasGotHeader_ = false;
    TS_LOGI("Parser raw trace end!");
}
void RawTraceParser::UpdateTraceMinRange()
{
    auto schedSlice = traceDataCache_->GetConstSchedSliceData();
    std::set<uint32_t> uniqueCpuIdSet;
    uint64_t cpuRunningStatMinTime = INVALID_TIME;
    for (size_t i = 0; i < schedSlice.Size() && uniqueCpuIdSet.size() <= cpuCoreMax_; i++) {
        auto itor = uniqueCpuIdSet.find(schedSlice.CpusData()[i]);
        if (itor != uniqueCpuIdSet.end()) {
            continue;
        }
        uniqueCpuIdSet.emplace(schedSlice.CpusData()[i]);
        cpuRunningStatMinTime = schedSlice.TimeStampData()[i];
        TS_LOGW("curCpuId=%u, cpuRunningStatMinTime=%" PRIu64 "", schedSlice.CpusData()[i], cpuRunningStatMinTime);
    }
    traceDataCache_->UpdateTraceMinTime(cpuRunningStatMinTime);
}
bool RawTraceParser::InitRawTraceFileHeader(std::deque<uint8_t>::iterator& packagesCurIter)
{
    TS_CHECK_TRUE(packagesBuffer_.size() >= sizeof(RawTraceFileHeader), false,
                  "buffer size less than rawtrace file header");
    RawTraceFileHeader header;
    auto ret = memcpy_s(&header, sizeof(RawTraceFileHeader), &(*packagesBuffer_.begin()), sizeof(RawTraceFileHeader));
    TS_CHECK_TRUE(ret == EOK, false, "Memcpy FAILED!Error code is %d, data size is %zu.", ret, packagesBuffer_.size());
    TS_LOGI("magicNumber=%d fileType=%d", header.magicNumber, header.fileType);

    fileType_ = header.fileType;
    packagesCurIter += sizeof(RawTraceFileHeader);
    packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
    hasGotHeader_ = true;
    return true;
}
bool RawTraceParser::InitEventFormats(const std::string& buffer)
{
    std::string line;
    std::istringstream iss(buffer);
    std::stringstream eventFormat;
    while (std::getline(iss, line)) {
        eventFormat << line << '\n';
        if (base::StartWith(line, eventEndCmd_)) {
            ftraceProcessor_->SetupEvent(eventFormat.str());
            eventFormat.str("");
        }
    }
    return true;
}
bool RawTraceParser::UpdateCpuCoreMax(uint32_t cpuId)
{
    if (cpuId >= cpuCoreMax_) {
        cpuCoreMax_++;
        TS_LOGD("cpuId=%u, cpuCoreMax_=%u", cpuId, cpuCoreMax_);
        return false;
    }
    return true;
}

bool RawTraceParser::ParseCpuRawData(uint32_t cpuId, const std::string& buffer)
{
    UpdateCpuCoreMax(cpuId);
    TS_CHECK_TRUE(buffer.size() > 0, true, "cur cpu(%u) raw data is null!", cpuId);
    auto startPtr = reinterpret_cast<const uint8_t*>(buffer.c_str());
    auto endPtr = startPtr + buffer.size();
    cpuDetail_->set_cpu(cpuId);
    for (uint8_t* page = const_cast<uint8_t*>(startPtr); page < endPtr; page += FTRACE_PAGE_SIZE) {
        TS_CHECK_TRUE(ftraceProcessor_->HandlePage(*cpuDetail_.get(), *cpuDetailParser_.get(), page), false,
                      "handle page failed!");
    }
    cpuDetailParser_->FilterAllEvents(*cpuDetail_.get());
    return true;
}

bool RawTraceParser::HmParseCpuRawData(const std::string& buffer)
{
    TS_CHECK_TRUE(buffer.size() > 0, true, "hm raw data is null!");
    auto startPtr = reinterpret_cast<const uint8_t*>(buffer.c_str());
    auto endPtr = startPtr + buffer.size();

    for (uint8_t* data = const_cast<uint8_t*>(startPtr); data < endPtr;) {
        TS_CHECK_TRUE(ftraceProcessor_->HmParsePageData(*cpuDetail_.get(), *cpuDetailParser_.get(), data), false,
                      "hm parse page failed!");
        cpuDetailParser_->FilterAllEvents(*cpuDetail_.get());
    }
    TS_LOGD("mark.debug. HmParseCpuRawData end success");
    return true;
}

bool RawTraceParser::ParseLastCommData(uint8_t type, const std::string& buffer)
{
    TS_CHECK_TRUE_RET(restCommDataCnt_ != INVALID_UINT8, false);
    switch (type) {
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CMDLINES):
            TS_CHECK_TRUE(ftraceProcessor_->HandleCmdlines(buffer), false, "parse cmdlines failed");
            ++restCommDataCnt_;
            return true;
        case static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_TGIDS):
            TS_CHECK_TRUE(ftraceProcessor_->HandleTgids(buffer), false, "parse tgid failed");
            ++restCommDataCnt_;
            return true;
        default:
            break;
    }
#ifdef IS_WASM
    return false;
#else
    return true;
#endif
}
void RawTraceParser::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish)
{
    packagesBuffer_.insert(packagesBuffer_.end(), &bufferStr[0], &bufferStr[size]);
    auto packagesCurIter = packagesBuffer_.begin();
    if (ParseDataRecursively(packagesCurIter)) {
        packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
    }
    if (isFinish) {
        restCommDataCnt_ = INVALID_UINT8;
        hasGotHeader_ = false;
        packagesBuffer_.clear();
    }
    return;
}
bool RawTraceParser::ParseDataRecursively(std::deque<uint8_t>::iterator& packagesCurIter)
{
    uint32_t type = 0;
    uint32_t len = 0;
    if (!hasGotHeader_) {
        TS_CHECK_TRUE(InitRawTraceFileHeader(packagesCurIter), false, "get rawtrace file header failed");
    }
    while (true) {
        std::copy(packagesCurIter, packagesCurIter + sizeof(type), reinterpret_cast<uint8_t*>(&type));
        packagesCurIter += sizeof(type);
        std::copy(packagesCurIter, packagesCurIter + sizeof(len), reinterpret_cast<uint8_t*>(&len));
        packagesCurIter += sizeof(len);
        uint32_t restDataLen = std::distance(packagesCurIter, packagesBuffer_.end());
        TS_CHECK_TRUE_RET(len <= restDataLen && packagesBuffer_.size() > 0, false);
        std::string bufferLine(packagesCurIter, packagesCurIter + len);
        packagesCurIter += len;
        packagesCurIter = packagesBuffer_.erase(packagesBuffer_.begin(), packagesCurIter);
        uint8_t curType = static_cast<uint8_t>(type);
        if (ParseLastCommData(curType, bufferLine)) {
            continue;
        }
        if (curType >= static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CPU_RAW) &&
            curType < static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_HEADER_PAGE)) {
            if (fileType_ == static_cast<uint8_t>(RawTraceFileType::FILE_RAW_TRACE)) {
                auto cpuId = curType - static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_CPU_RAW);
                TS_CHECK_TRUE(ParseCpuRawData(cpuId, bufferLine), false, "cpu raw parse failed");
            } else if (fileType_ == static_cast<uint8_t>(RawTraceFileType::HM_FILE_RAW_TRACE)) {
                TS_CHECK_TRUE(HmParseCpuRawData(bufferLine), false, "hm raw trace parse failed");
            }
        } else if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_EVENTS_FORMAT)) {
            TS_CHECK_TRUE(InitEventFormats(bufferLine), false, "init event format failed");
        } else if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_HEADER_PAGE)) {
            TS_CHECK_TRUE(ftraceProcessor_->HandleHeaderPageFormat(bufferLine), false, "init header page failed");
        } else if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_PRINTK_FORMATS)) {
            TS_CHECK_TRUE(PrintkFormatsProcessor::GetInstance().HandlePrintkSyms(bufferLine), false,
                          "init printk_formats failed");
        } else if (curType == static_cast<uint8_t>(RawTraceContentType::CONTENT_TYPE_KALLSYMS)) {
            TS_CHECK_TRUE(ksymsProcessor_->HandleKallSyms(bufferLine), false, "init printk_formats failed");
        } else {
            TS_LOGW("Raw Trace Type(%d) Unknown or has been parsed.", curType);
        }
    }
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
