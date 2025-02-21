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

#include "ebpf_splitter.h"
#include <cinttypes>

namespace SysTuning {
namespace TraceStreamer {
// using namespace SysTuning::base;
using namespace SysTuning::EbpfStdtype;
void EbpfSplitter::SetEbpfDataOffset(uint64_t offset)
{
    // 记录ebpf的1024头相对于文件的位置。
    offsetOfEbpfDataInFile_ = offset;
}

void EbpfSplitter::SetSpliteTimeRange(uint64_t splitFileMinTs, uint64_t splitFileMaxTs)
{
    splitFileMinTs_ = splitFileMinTs;
    splitFileMaxTs_ = splitFileMaxTs;
    TS_LOGI("splitFileMinTs_ = %" PRIu64 ", splitFileMaxTs_ = %" PRIu64 "", splitFileMinTs_, splitFileMaxTs_);
}
bool EbpfSplitter::SplitEbpfHeader(std::deque<uint8_t> &dequeBuffer)
{
    splitEbpfHeader_ = std::make_unique<EbpfDataHeader>();
    std::copy_n(dequeBuffer.begin(), EbpfDataHeader::EBPF_DATA_HEADER_SIZE,
                reinterpret_cast<char *>(splitEbpfHeader_.get()));
    if (splitEbpfHeader_->header.magic != EbpfDataHeader::HEADER_MAGIC) {
        TS_LOGE("Get EBPF file header failed! magic = %" PRIx64 "", splitEbpfHeader_->header.magic);
        return false;
    }
    if (splitEbpfHeader_->header.headSize != EbpfDataHeader::EBPF_DATA_HEADER_SIZE) {
        TS_LOGE("Get ebpf file header failed! headSize = %u", splitEbpfHeader_->header.headSize);
        return false;
    }
    TS_LOGI("EBPF data header : magic = %" PRIu64 ", headSize = %u, clock = %u, cmdline = %s",
            splitEbpfHeader_->header.magic, splitEbpfHeader_->header.headSize, splitEbpfHeader_->header.clock,
            splitEbpfHeader_->cmdline);
    splittedLen_ += EbpfDataHeader::EBPF_DATA_HEADER_SIZE;
    dequeBuffer.erase(dequeBuffer.begin(), dequeBuffer.begin() + EbpfDataHeader::EBPF_DATA_HEADER_SIZE);
    return true;
}

bool EbpfSplitter::AddAndSplitEbpfData(std::deque<uint8_t> &dequeBuffer)
{
    if (!splitEbpfHeader_) {
        HtraceSplitResult ebpfHtraceHead = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_DATA,
                                            .buffer = {.address = reinterpret_cast<uint8_t *>(&profilerHeader_),
                                                       .size = sizeof(ProfilerTraceFileHeader)}};
        ebpfSplitResult_.emplace_back(ebpfHtraceHead);
        if (dequeBuffer.size() >= EbpfDataHeader::EBPF_DATA_HEADER_SIZE) {
            auto ret = SplitEbpfHeader(dequeBuffer);
            HtraceSplitResult ebpfHead = {.type = (int32_t)SplitDataDataType::SPLIT_FILE_DATA,
                                          .buffer = {.address = reinterpret_cast<uint8_t *>(splitEbpfHeader_.get()),
                                                     .size = EbpfDataHeader::EBPF_DATA_HEADER_SIZE}};
            ebpfSplitResult_.emplace_back(ebpfHead);
            TS_ASSERT(ret);
        } else {
            return false;
        }
    }

    SplitEbpfBodyData(dequeBuffer);
    uint64_t unUsedLength = profilerHeader_.data.length - sizeof(ProfilerTraceFileHeader) - splittedLen_;
    if (unUsedLength < EBPF_TITLE_SIZE) {
        profilerHeader_.data.length = usefulDataLen_ + sizeof(ProfilerTraceFileHeader) + sizeof(EbpfDataHeader);

        dequeBuffer.erase(dequeBuffer.begin(), dequeBuffer.begin() + unUsedLength);
        return true;
    }
    return false;
}
void EbpfSplitter::AppendSplitOriginSegResult(uint32_t segLen)
{
    HtraceSplitResult publicDataOffset{.type = (int32_t)SplitDataDataType::SPLIT_FILE_JSON,
                                       .originSeg = {.offset = offsetOfEbpfDataInFile_ + splittedLen_, .size = segLen}};
    usefulDataLen_ += segLen;
    ebpfSplitResult_.emplace_back(publicDataOffset);
}
void EbpfSplitter::SplitEbpfBodyData(std::deque<uint8_t> &dequeBuffer)
{
    while (profilerHeader_.data.length - sizeof(ProfilerTraceFileHeader) - splittedLen_ > EBPF_TITLE_SIZE &&
           dequeBuffer.size() > EBPF_TITLE_SIZE) {
        EbpfTypeAndLength dataTitle;
        std::copy_n(dequeBuffer.begin(), EBPF_TITLE_SIZE, reinterpret_cast<char *>(&dataTitle));
        if (dataTitle.length + EBPF_TITLE_SIZE > dequeBuffer.size()) {
            return;
        }
        auto segLen = EBPF_TITLE_SIZE + dataTitle.length;
        switch (dataTitle.type) {
            case ITEM_EVENT_MAPS:
            case ITEM_SYMBOL_INFO:
            case ITEM_EVENT_STR:
            case ITEM_EVENT_KENEL_SYMBOL_INFO: {
                AppendSplitOriginSegResult(segLen);
                break;
            }
            case ITEM_EVENT_FS: {
                FsFixedHeader fsFixedHeader;
                AppendSplitResultWithFixedHeader(segLen, dequeBuffer, fsFixedHeader);
                break;
            }
            case ITEM_EVENT_VM: {
                PagedMemoryFixedHeader pagedMemoryFixedHeader;
                AppendSplitResultWithFixedHeader(segLen, dequeBuffer, pagedMemoryFixedHeader);
                break;
            }
            case ITEM_EVENT_BIO: {
                BIOFixedHeader bioFixedHeader;
                AppendSplitResultWithFixedHeader(segLen, dequeBuffer, bioFixedHeader);
                break;
            }
            default:
                TS_LOGI("Do not support EBPF type: %d, length: %d", dataTitle.type, dataTitle.length);
        }
        dequeBuffer.erase(dequeBuffer.begin(), dequeBuffer.begin() + segLen);
        splittedLen_ += segLen;
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
