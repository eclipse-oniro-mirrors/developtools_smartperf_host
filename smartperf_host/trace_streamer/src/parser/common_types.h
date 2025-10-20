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

#ifndef BYTRACE_COMMON_TYPES_H
#define BYTRACE_COMMON_TYPES_H

#include <atomic>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include "proto_reader_help.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
enum ParseResult { PARSE_ERROR = 0, PARSE_SUCCESS = 1 };
enum RawType { RAW_CPU_IDLE = 1, RAW_SCHED_WAKEUP = 2, RAW_SCHED_WAKING = 3 };
enum ErrorCode { ERROR_CODE_EXIT = -2, ERROR_CODE_NODATA = -1 };
struct BytraceLine {
    uint64_t ts = 0;
    uint32_t pid = 0;
    uint32_t cpu = 0;

    std::string task; // thread name
    uint32_t tgid = 0;
    std::string eventName;
    std::string argsStr;
};
enum ParseStatus {
    TS_PARSE_STATUS_INIT = 0,
    TS_PARSE_STATUS_SEPRATED = 1,
    TS_PARSE_STATUS_PARSING = 2,
    TS_PARSE_STATUS_PARSED = 3,
    TS_PARSE_STATUS_INVALID = 4
};
struct DataSegment {
    std::string seg;
    BytraceLine bufLine;
    std::atomic<ParseStatus> status{TS_PARSE_STATUS_INIT};
};
struct HilogLine {
    uint64_t lineSeq;
    uint64_t timeStamp;
    uint32_t pid;
    uint32_t tid;
    std::string level;
    std::string tag;
    std::string context;
};
struct PbreaderDataSegment {
    std::shared_ptr<std::string> seg;
    uint64_t timeStamp{INVALID_TIME};
    std::atomic<BuiltinClocks> clockId;
    DataSourceType dataType;
    std::atomic<ParseStatus> status{TS_PARSE_STATUS_INIT};
    ProtoReader::BytesView protoData;
};
struct RawtraceDataSegment {
    std::shared_ptr<std::string> seg;
    uint64_t timeStamp;
    std::atomic<ParseStatus> status{TS_PARSE_STATUS_INIT};
};

class TracePoint {
public:
    TracePoint() {}
    TracePoint(const TracePoint &point)
        : phase_(point.phase_),
          tgid_(point.tgid_),
          name_(point.name_),
          value_(point.value_),
          categoryGroup_(point.categoryGroup_),
          chainId_(point.chainId_),
          spanId_(point.spanId_),
          parentSpanId_(point.parentSpanId_),
          flag_(point.flag_),
          args_(point.args_),
          funcPrefixId_(point.funcPrefixId_),
          funcPrefix_(point.funcPrefix_),
          funcArgs_(point.funcArgs_),
          traceLevel_(point.traceLevel_),
          traceTagId_(point.traceTagId_),
          customCategoryId_(point.customCategoryId_),
          customArgsId_(point.customArgsId_)
    {
    }
    void operator=(const TracePoint &point)
    {
        phase_ = point.phase_;
        tgid_ = point.tgid_;
        name_ = point.name_;
        value_ = point.value_;
        categoryGroup_ = point.categoryGroup_;
        chainId_ = point.chainId_;
        spanId_ = point.spanId_;
        parentSpanId_ = point.parentSpanId_;
        flag_ = point.flag_;
        args_ = point.args_;
        funcPrefixId_ = point.funcPrefixId_;
        funcPrefix_ = point.funcPrefix_;
        funcArgs_ = point.funcArgs_;
        traceLevel_ = point.traceLevel_;
        traceTagId_ = point.traceTagId_;
        customCategoryId_ = point.customCategoryId_;
        customArgsId_ = point.customArgsId_;
    }
    char phase_ = '\0';
    uint32_t tgid_ = 0;
    std::string name_ = "";
    int64_t value_ = 0;
    std::string categoryGroup_ = "";
    // Distributed Data
    std::string chainId_ = "";
    std::string spanId_ = "";
    std::string parentSpanId_ = "";
    std::string flag_ = "";
    std::string args_ = "";
    uint32_t funcPrefixId_ = 0;
    std::string funcPrefix_ = "";
    std::string funcArgs_ = "";
    std::string traceLevel_ = "";
    DataIndex traceTagId_ = INVALID_UINT64;
    DataIndex customCategoryId_ = INVALID_UINT64;
    DataIndex customArgsId_ = INVALID_UINT64;
};

enum class SplitDataDataType { SPLIT_FILE_DATA = 0, SPLIT_FILE_JSON };
struct HtraceSplitResult {
    int32_t type;
    union {
        struct {
            uint8_t *address;
            uint64_t size;
        } buffer;
        struct {
            uint64_t offset;
            uint64_t size;
        } originSeg;
    };
};

struct RawTraceFileHeader {
    uint16_t magicNumber;
    uint8_t fileType;
    uint16_t versionNumber;
    uint32_t reserved;
} __attribute__((aligned(4)));

enum class RawTraceContentType : uint8_t {
    CONTENT_TYPE_DEFAULT = 0,
    CONTENT_TYPE_EVENTS_FORMAT = 1,
    CONTENT_TYPE_CMDLINES = 2,
    CONTENT_TYPE_TGIDS = 3,
    CONTENT_TYPE_CPU_RAW = 4,
    CONTENT_TYPE_HEADER_PAGE = 30,
    CONTENT_TYPE_PRINTK_FORMATS = 31,
    CONTENT_TYPE_KALLSYMS = 32
};
enum class RawTraceFileType : uint8_t { FILE_RAW_TRACE = 0, HM_FILE_RAW_TRACE = 1 };
} // namespace TraceStreamer
} // namespace SysTuning
#endif // _BYTRACE_COMMON_TYPES_H_
