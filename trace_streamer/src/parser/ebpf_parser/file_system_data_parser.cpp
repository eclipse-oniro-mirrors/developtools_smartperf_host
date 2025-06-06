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
#include "file_system_data_parser.h"
#include "process_filter.h"
#include "stat_filter.h"
#include "string_to_numerical.h"
#include <cinttypes>

namespace SysTuning {
namespace TraceStreamer {
FileSystemDataParser::FileSystemDataParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx), EbpfBase(dataCache, ctx), timeParser_(std::make_unique<HtracePluginTimeParser>())
{
}
FileSystemDataParser::~FileSystemDataParser()
{
    TS_LOGI("EBPF FileSystem data ts MIN:%llu, MAX:%llu",
            static_cast<unsigned long long>(timeParser_->GetPluginStartTime()),
            static_cast<unsigned long long>(timeParser_->GetPluginEndTime()));
}

void FileSystemDataParser::IpAndCallidFind(const FsFixedHeader *fsFixedHeadrAddr,
                                           bool &callIdExistFlag,
                                           const uint64_t *userIpsAddr)
{
    if (fsFixedHeadrAddr->nrUserIPs) {
        std::string ipsToStr(reinterpret_cast<const char *>(userIpsAddr), fsFixedHeadrAddr->nrUserIPs * SINGLE_IP_SIZE);
        auto ipsHashValue = hashFun_(ipsToStr);
        auto value = pidAndipsToCallId_.Find(fsFixedHeadrAddr->pid, ipsHashValue);
        if (value != INVALID_UINT32) {
            callIdExistFlag = true;
            currentCallId_ = value;
        } else {
            pidAndipsToCallId_.Insert(fsFixedHeadrAddr->pid, ipsHashValue, callChainId_);
            currentCallId_ = callChainId_++;
        }
    } else {
        currentCallId_ = INVALID_UINT32;
    }
}

uint64_t FileSystemDataParser::StartEndTime(const FsFixedHeader *fsFixedHeadrAddr,
                                            uint64_t newStartTs,
                                            uint64_t newEndTs,
                                            DataIndex &returnValue,
                                            DataIndex &errorCode)
{
    // When the data is invalid, calling the sub function under condition (newStartTs > newEndTs) ends the judgment
    timeParser_->UpdatePluginTimeRange(clockId_, fsFixedHeadrAddr->startTime, newStartTs);
    timeParser_->UpdatePluginTimeRange(clockId_, fsFixedHeadrAddr->endTime, newEndTs);
    if (newStartTs > newEndTs) {
        TS_LOGE("startTs = %" PRIu64 ", endTs = %" PRIu64 ", newStartTs = %" PRIu64 ", newEndTs = %" PRIu64 "",
                fsFixedHeadrAddr->startTime, fsFixedHeadrAddr->endTime, newStartTs, newEndTs);
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_EBPF_FILE_SYSTEM, STAT_EVENT_DATA_INVALID);
        // When the data is invalid, the maximum value returned is uint64_t(numeric_limits<uint64_t>::max());
        return std::numeric_limits<uint64_t>::max();
    }
    uint64_t duration = newEndTs - newStartTs;
    if (fsFixedHeadrAddr->ret < 0) {
        returnValue = ConvertToHexTextIndex(0);
        errorCode = ConvertToHexTextIndex(-fsFixedHeadrAddr->ret);
    } else {
        returnValue = ConvertToHexTextIndex(fsFixedHeadrAddr->ret);
    }
    return duration;
}

template <typename TracerEventToStrIndexMap>
size_t FileSystemDataParser::FileWriteOperation(TracerEventToStrIndexMap &tracerEventToStrIndexMap,
                                                const FsFixedHeader *fsFixedHeadrAddr,
                                                uint32_t itid,
                                                uint64_t &filePathId,
                                                uint16_t type)
{
    filePathId =
        tracerEventToStrIndexMap.Find(ITEM_EVENT_FS, fsFixedHeadrAddr->type, itid, fsFixedHeadrAddr->startTime);
    if (filePathId != INVALID_UINT64) {
        tracerEventToStrIndexMap.Erase(ITEM_EVENT_FS, fsFixedHeadrAddr->type, itid, fsFixedHeadrAddr->startTime);
    }

    // get read or writ size
    size_t size = MAX_SIZE_T;
    if ((type == READ || type == WRITE) && fsFixedHeadrAddr->ret >= 0) {
        size = fsFixedHeadrAddr->ret;
    }
    return size;
}

void FileSystemDataParser::ParseFileSystemEvent()
{
    auto &tracerEventToStrIndexMap = reader_->GetTracerEventToStrIndexMap();
    for (auto mapItor = reader_->GetFileSystemEventMap().begin(); mapItor != reader_->GetFileSystemEventMap().end();
         mapItor++) {
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_EBPF_FILE_SYSTEM, STAT_EVENT_RECEIVED);
        auto fsFixedHeadrAddr = mapItor->second;
        bool callIdExistFlag = false;
        auto userIpsAddr = reinterpret_cast<const uint64_t *>(fsFixedHeadrAddr + 1);
        // Find the corresponding callId for the number of user IP addresses
        IpAndCallidFind(fsFixedHeadrAddr, callIdExistFlag, userIpsAddr);
        uint16_t type = INVALID_UINT16;
        auto tmp = fucSubToSummaryType.find(fsFixedHeadrAddr->type);
        if (tmp == fucSubToSummaryType.end()) {
            return;
        }
        type = fucSubToSummaryType.at(fsFixedHeadrAddr->type);
        // Init process name data
        auto processName = const_cast<char *>(fsFixedHeadrAddr->processName);
        processName[MAX_PROCESS_NAME_SZIE - 1] = '\0';
        uint32_t ipid =
            streamFilters_->processFilter_->UpdateOrCreateProcessWithName(fsFixedHeadrAddr->pid, processName);
        uint32_t itid =
            streamFilters_->processFilter_->GetOrCreateThreadWithPid(fsFixedHeadrAddr->tid, fsFixedHeadrAddr->pid);
        auto newStartTs = streamFilters_->clockFilter_->ToPrimaryTraceTime(clockId_, fsFixedHeadrAddr->startTime);
        auto newEndTs = streamFilters_->clockFilter_->ToPrimaryTraceTime(clockId_, fsFixedHeadrAddr->endTime);
        DataIndex returnValue = INVALID_UINT64;
        DataIndex errorCode = INVALID_UINT64;
        //(newStartTs > newEndTs), When the data is invalid, the maximum value returned is uint64_t(size_t size
        //=numeric_limits<uint64_t>::max());
        uint64_t duration = StartEndTime(fsFixedHeadrAddr, newStartTs, newEndTs, returnValue, errorCode);
        if (newStartTs > newEndTs) {
            return;
        }
        int32_t i = 0;
        auto firstArgument = ConvertToHexTextIndex(fsFixedHeadrAddr->args[i++]);
        auto secondArgument = ConvertToHexTextIndex(fsFixedHeadrAddr->args[i++]);
        auto thirdArgument = ConvertToHexTextIndex(fsFixedHeadrAddr->args[i++]);
        auto fourthArgument = ConvertToHexTextIndex(fsFixedHeadrAddr->args[i]);
        // get file descriptor
        uint64_t filePathId = INVALID_UINT64;
        auto fd = GetFileDescriptor(fsFixedHeadrAddr, type);
        size_t size = FileWriteOperation(tracerEventToStrIndexMap, fsFixedHeadrAddr, itid, filePathId, type);
        FileSystemSampleRow fileSystemSampleRow = {
            currentCallId_, type, ipid, itid,       newStartTs,    newEndTs,       duration,      returnValue,
            errorCode,      size, fd,   filePathId, firstArgument, secondArgument, thirdArgument, fourthArgument};
        traceDataCache_->GetFileSystemSample()->AppendNewData(fileSystemSampleRow);
        if (!callIdExistFlag) {
            ParseCallStackData(userIpsAddr, fsFixedHeadrAddr->nrUserIPs, fsFixedHeadrAddr->pid, currentCallId_);
        }
    }
}

int32_t FileSystemDataParser::GetFileDescriptor(const FsFixedHeader *fsFixedHeader, uint32_t fucType)
{
    auto returnValue = fsFixedHeader->ret;
    int32_t fd = INVALID_INT32;
    if (fucType == OPEN and returnValue >= 0) {
        fd = returnValue;
    } else if (fucType == READ or fucType == WRITE) {
        fd = fsFixedHeader->args[0];
    } else if (fucType == CLOSE) {
        fd = fsFixedHeader->args[1];
    }
    return fd;
}
} // namespace TraceStreamer
} // namespace SysTuning
