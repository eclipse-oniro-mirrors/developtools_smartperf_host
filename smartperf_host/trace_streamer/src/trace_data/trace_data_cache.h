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

#ifndef TRACE_DATA_CACHE_H
#define TRACE_DATA_CACHE_H

#include <memory>
#include "trace_data_cache_reader.h"
#include "trace_data_cache_writer.h"
#include "trace_data_db.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace TraceStdtype;
class TraceDataCache : public TraceDataCacheReader, public TraceDataCacheWriter, public TraceDataDB {
public:
    TraceDataCache();
    TraceDataCache(const TraceDataCache *dataCache) = delete;
    TraceDataCache *operator=(const TraceDataCache *dataCache) = delete;
    ~TraceDataCache() override;

    bool AnimationTraceEnabled() const;
    void UpdateAnimationTraceStatus(bool status);
    bool TaskPoolTraceEnabled() const;
    void UpdateTaskPoolTraceStatus(bool status);
    bool AppStartTraceEnabled() const;
    void UpdateAppStartTraceStatus(bool status);
    bool BinderRunnableTraceEnabled() const;
    void UpdateBinderRunnableTraceStatus(bool status);
    bool HMKernelTraceEnabled() const;
    void UpdateHMKernelTraceStatus(bool status);
    bool RawTraceCutStartTsEnabled() const;
    void UpdateRawTraceCutStartTsStatus(bool status);
    uint64_t SplitFileMaxTime();
    uint64_t SplitFileMinTime();
    void SetSplitFileMaxTime(uint64_t maxTs);
    void SetSplitFileMinTime(uint64_t minTs);
    std::deque<std::unique_ptr<std::string>> &HookCommProtos();
    void ClearHookCommProtos();
    int32_t ExportPerfReadableText(const std::string &outputName, TraceDataDB::ResultCallBack resultCallBack = nullptr);
    int32_t ExportHookReadableText(const std::string &outputName, TraceDataDB::ResultCallBack resultCallBack = nullptr);
    int32_t ExportEbpfReadableText(const std::string &outputName, TraceDataDB::ResultCallBack resultCallBack = nullptr);
    void ClearAllExportedCacheData();
    void UpdateAllReadySize();

private:
    void InitDB();
    void ExportPerfCallChaninText(uint32_t callChainId, std::string &bufferLine);
    void ExportHookCallChaninText(uint32_t callChainId, std::string &bufferLine);
    bool ExportHookDataReadableText(int32_t fd, std::string &bufferLine);
    bool ExportHookStatisticReadableText(int32_t fd, std::string &bufferLine);
    using EbpfEventTypeMap = std::map<uint32_t, std::string_view>;
    bool ExportEbpfFileSystemReadableText(int32_t fd,
                                          std::string &bufferLine,
                                          const EbpfEventTypeMap &ebpfEventTypeMap);
    bool ExportEbpfPagedMemReadableText(int32_t fd, std::string &bufferLine, const EbpfEventTypeMap &ebpfEventTypeMap);
    bool ExportEbpfBIOReadableText(int32_t fd, std::string &bufferLine, const EbpfEventTypeMap &ebpfEventTypeMap);
    void ExportEbpfCallChaninText(uint32_t callChainId, std::string &bufferLine);
    void InitBaseDB();
    void InitEbpfDB();
    void InitNativeMemoryDB();
    void InitArkTsDB();
    void InitHiperfDB();
    void InitMeasureDB();
    void InitTemplateDB();
    void InitRenderServiceDB();
    void InitMemoryDB();
    void InitHisysEventDB();
    void InitXPowerDB();
    void ExportPerfSampleToFile(std::string &perfBufferLine,
                                int32_t perfFd,
                                const std::string &outputName,
                                uint64_t row);

private:
    bool dbInited_ = false;
    bool animationTraceEnabled_ = false;
    bool taskPoolTraceEnabled_ = false;
    bool appStartTraceEnabled_ = false;
    bool binderRunnableTraceEnabled_ = false;
    bool HMKernelTraceEnabled_ = false;
    bool rawTraceCutStartTsEnabled_ = true;
    uint64_t splitFileMinTs_ = INVALID_UINT64;
    uint64_t splitFileMaxTs_ = INVALID_UINT64;
    std::deque<std::unique_ptr<std::string>> hookCommProtos_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // TRACE_DATA_CACHE_H
