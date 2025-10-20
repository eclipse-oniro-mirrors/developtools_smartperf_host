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

#ifndef OFFLINE_SYMBOLIZATION_FILTER_H
#define OFFLINE_SYMBOLIZATION_FILTER_H
#include "double_map.h"
#if is_mingw || is_mac
#include "dfx_nonlinux_define.h"
#else
#include <elf.h>
#endif
#include <unordered_map>
#include "native_hook_result.pbreader.h"
#include "process_filter.h"
#include "proto_reader.h"
#include "string_help.h"
#include "ts_common.h"
namespace SysTuning {
namespace TraceStreamer {
constexpr uint64_t ALLOC_IP_MASK = 0xFFFFFF0000000000;
constexpr uint64_t JS_IP_MASK = 0xFFFFFE0000000000;
class FrameInfo {
public:
    FrameInfo()
    {
        filePathId_ = INVALID_UINT32;
        ip_ = INVALID_UINT64;
        symbolIndex_ = INVALID_UINT64;
        offset_ = INVALID_UINT64;
        symbolOffset_ = INVALID_UINT64;
        symVaddr_ = INVALID_UINT64;
    }
    uint32_t filePathId_;
    uint64_t ip_;
    uint64_t symbolIndex_;
    uint64_t offset_;
    uint64_t symbolOffset_;
    uint64_t symVaddr_;
};
struct NativeHookMetaData {
    NativeHookMetaData(const std::shared_ptr<const std::string> &seg,
                       std::unique_ptr<ProtoReader::NativeHookData_Reader> reader)
        : seg_(seg), reader_(std::move(reader))
    {
    }
    std::shared_ptr<const std::string> seg_;
    std::unique_ptr<ProtoReader::NativeHookData_Reader> reader_;
};
class OfflineSymbolizationFilter : public FilterBase {
public:
    OfflineSymbolizationFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ~OfflineSymbolizationFilter() override = default;
    std::shared_ptr<FrameInfo> OfflineSymbolizationByIp(uint64_t ipid, uint64_t ip);

protected:
    enum SYSTEM_ENTRY_VALUE { ELF32_SYM = 16, ELF64_SYM = 24 };
    using StartAddrToMapsInfoType = std::map<uint64_t, std::shared_ptr<ProtoReader::MapsInfo_Reader>>;
    DoubleMap<uint32_t, uint64_t, const uint8_t *> filePathIdAndStValueToSymAddr_;
    DoubleMap<std::shared_ptr<ProtoReader::SymbolTable_Reader>, uint64_t, const uint8_t *>
        symbolTablePtrAndStValueToSymAddr_;
    // first is ipid, second is startAddr, third is MapsInfo ptr
    DoubleMap<uint64_t /* ipid */, uint64_t /* startAddr */, std::shared_ptr<ProtoReader::MapsInfo_Reader>>
        ipidToStartAddrToMapsInfoMap_;
    // first is ipid, second is ip, third is FrameInfo
    DoubleMap<uint64_t, uint64_t, std::shared_ptr<FrameInfo>> ipidToIpToFrameInfo_;
    DoubleMap<uint64_t /* ipid */, uint32_t /* filePathId */, std::shared_ptr<ProtoReader::SymbolTable_Reader>>
        ipidTofilePathIdToSymbolTableMap_;
    std::unordered_map<uint32_t, std::shared_ptr<ElfSymbolTable>> filePathIdToImportSymbolTableMap_ = {};

    using IpToFrameInfoType = std::map<uint64_t, std::shared_ptr<FrameInfo>>;

    std::vector<std::shared_ptr<const std::string>> segs_ = {};
    const uint32_t SINGLE_PROC_IPID = 0;
    bool isSingleProcData_ = true;

private:
    template <class T>
    static void GetSymbolStartMaybeUpdateFrameInfo(T *elfSym,
                                                   uint32_t &symbolStart,
                                                   uint64_t symVaddr,
                                                   uint64_t ip,
                                                   FrameInfo *frameInfo);
    bool FillFrameInfo(const std::shared_ptr<FrameInfo> &frameInfo, uint64_t ip, uint64_t ipid);
    bool CalcSymInfo(uint64_t ipid,
                     uint64_t ip,
                     uint32_t &symbolStart,
                     std::shared_ptr<FrameInfo> &frameInfo,
                     std::shared_ptr<ProtoReader::SymbolTable_Reader> &symbolTable);
    uint64_t vmStart_ = INVALID_UINT64;
    uint64_t vmOffset_ = INVALID_UINT64;
};

} // namespace TraceStreamer
} // namespace SysTuning
#endif
