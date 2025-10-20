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

#ifndef EBPF_DATA_READER_H
#define EBPF_DATA_READER_H
#if is_mingw || is_mac
#include "dfx_nonlinux_define.h"
#else
#include <elf.h>
#endif
#include <string>
#include "ebpf_data_structure.h"
#include "event_parser_base.h"
#include "process_filter.h"
#include "quatra_map.h"
#include "string_help.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "unordered_map"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::EbpfStdtype;
class EbpfDataReader : private EventParserBase {
public:
    using ElfDoubleMap = DoubleMap<const ElfEventFixedHeader *, uint64_t, const uint8_t *>;
    EbpfDataReader(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    ~EbpfDataReader() = default;
    bool InitEbpfData(const std::deque<uint8_t> &dequeBuffer, uint64_t size);
    const EbpfDataHeader *GetEbpfDataHeader() const;
    const std::multimap<uint64_t, const FsFixedHeader *> &GetFileSystemEventMap() const;
    const std::multimap<uint64_t, const PagedMemoryFixedHeader *> &GetPagedMemoryMap() const;
    const std::multimap<uint64_t, const BIOFixedHeader *> &GetBIOSampleMap() const;
    const DoubleMap<uint32_t, uint64_t, const MapsFixedHeader *> &GetPidAndStartAddrToMapsAddr() const;
    const ElfDoubleMap &GetElfAddrAndStartValueToSymAddr() const;
    const std::map<DataIndex, const ElfEventFixedHeader *> &GetElfPathIndexToElfAddr() const;
    QuatraMap<uint32_t, uint32_t, uint32_t, uint64_t, DataIndex> &GetTracerEventToStrIndexMap();
    EbpfSymbolInfo GetSymbolNameIndexFromElfSym(uint64_t ip);

private:
    bool ReadEbpfData();
    bool InitEbpfHeader();
    bool ReadItemEventMaps(const uint8_t *buffer, uint32_t size);
    bool ReadItemSymbolInfo(const uint8_t *buffer, uint32_t size);
    bool ReaItemKernelSymbolInfo(const uint8_t *buffer, uint32_t size);
    bool ReadItemEventFs(const uint8_t *buffer, uint32_t size);
    bool ReadItemEventPagedMemory(const uint8_t *buffer, uint32_t size);
    bool ReadItemEventBIO(const uint8_t *buffer, uint32_t size);
    bool ReadItemEventStr(const uint8_t *buffer, uint32_t size);
    bool EbpfTypeHandle(EbpfTypeAndLength *dataTitle, const uint8_t *startAddr);
    template <class T>
    void AddSymbolsToTable(T *firstSymbolAddr, const int size, const ElfEventFixedHeader *elfAddr);
    void UpdateElfAddrAndStValueToSymAddrMap(const ElfEventFixedHeader *elfAddr, uint32_t size);
    void ReadKernelSymAddrMap(const KernelSymbolInfoHeader *elfAddr, uint32_t size);
    void UpdateElfPathIndexToElfAddrMap(const ElfEventFixedHeader *elfAddr, uint32_t size);

public:
    uint64_t maxKernelAddr_ = 0;
    uint64_t minKernelAddr_ = std::numeric_limits<uint64_t>::max();

private:
    std::unique_ptr<uint8_t[]> buffer_;
    uint64_t bufferSize_ = 0;
    uint64_t unresolvedLen_ = 0;
    EbpfDataHeader *ebpfDataHeader_;
    uint8_t *startAddr_ = nullptr;
    std::multimap<uint64_t, const FsFixedHeader *> endTsToFsFixedHeader_ = {};
    std::multimap<uint64_t, const PagedMemoryFixedHeader *> endTsToPagedMemoryFixedHeader_ = {};
    std::multimap<uint64_t, const BIOFixedHeader *> endTsToBIOFixedHeader_ = {};
    std::map<DataIndex, const ElfEventFixedHeader *> elfPathIndexToElfFixedHeaderAddr_ = {};
    DoubleMap<uint32_t, uint64_t, const MapsFixedHeader *> pidAndStartAddrToMapsAddr_;
    ElfDoubleMap elfAddrAndStValueToSymAddr_;
    QuatraMap<uint32_t, uint32_t, uint32_t, uint64_t, DataIndex> tracerEventToStrIndex_;
    DataIndex kernelFilePath_;
    struct AddrDesc {
        uint64_t size = 0;
        DataIndex name = 0;
    };
    std::map<uint64_t, AddrDesc> kernelSymbolMap_ = {};
    static const uint32_t maxSymbolLength = 256;
    char strSymbolName_[maxSymbolLength] = {0};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // EBPF_DATA_READER_H
