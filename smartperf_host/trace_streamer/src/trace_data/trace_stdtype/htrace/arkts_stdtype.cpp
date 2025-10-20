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
#include "arkts_stdtype.h"

namespace SysTuning {
namespace TraceStdtype {
size_t JsHeapFiles::AppendNewData(uint32_t id,
                                  std::string filePath,
                                  uint64_t startTime,
                                  uint64_t endTime,
                                  uint64_t selfSizeCount)
{
    fileIds_.emplace_back(id);
    filePaths_.emplace_back(filePath);
    startTimes_.emplace_back(startTime);
    endTimes_.emplace_back(endTime);
    selfSizeCount_.emplace_back(selfSizeCount);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapFiles::IDs() const
{
    return fileIds_;
}
const std::deque<std::string> &JsHeapFiles::FilePaths() const
{
    return filePaths_;
}
const std::deque<uint64_t> &JsHeapFiles::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t> &JsHeapFiles::EndTimes() const
{
    return endTimes_;
}

const std::deque<uint64_t> &JsHeapFiles::SelfSizeCount() const
{
    return selfSizeCount_;
}

size_t JsHeapEdges::AppendNewData(const JsHeapEdgesRow &jsHeapEdgesRow)
{
    fileIds_.emplace_back(jsHeapEdgesRow.fileId);
    edgeIndexs_.emplace_back(jsHeapEdgesRow.edgeIndex);
    types_.emplace_back(jsHeapEdgesRow.type);
    nameOrIndexs_.emplace_back(jsHeapEdgesRow.nameOrIndex);
    toNodes_.emplace_back(jsHeapEdgesRow.toNode);
    fromNodeIds_.emplace_back(jsHeapEdgesRow.fromNodeId);
    toNodeIds_.emplace_back(jsHeapEdgesRow.toNodeId);
    ids_.emplace_back(Size());
    return Size() - 1;
}

const std::deque<uint32_t> &JsHeapEdges::FileIds() const
{
    return fileIds_;
}
const std::deque<uint32_t> &JsHeapEdges::EdgeIndexs() const
{
    return edgeIndexs_;
}
const std::deque<uint32_t> &JsHeapEdges::Types() const
{
    return types_;
}
const std::deque<uint32_t> &JsHeapEdges::NameOrIndexs() const
{
    return nameOrIndexs_;
}
const std::deque<uint32_t> &JsHeapEdges::ToNodes() const
{
    return toNodes_;
}
const std::deque<uint32_t> &JsHeapEdges::FromNodeIds() const
{
    return fromNodeIds_;
}
const std::deque<uint32_t> &JsHeapEdges::ToNodeIds() const
{
    return toNodeIds_;
}

size_t JsHeapInfo::AppendNewData(uint32_t fileId,
                                 std::string key,
                                 uint32_t type,
                                 int32_t intValue,
                                 std::string strValue)
{
    fileIds_.emplace_back(fileId);
    keys_.emplace_back(key);
    types_.emplace_back(type);
    intValues_.emplace_back(intValue);
    strValues_.emplace_back(strValue);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapInfo::FileIds() const
{
    return fileIds_;
}
const std::deque<std::string> &JsHeapInfo::Keys() const
{
    return keys_;
}
const std::deque<uint32_t> &JsHeapInfo::Types() const
{
    return types_;
}
const std::deque<int32_t> &JsHeapInfo::IntValues() const
{
    return intValues_;
}
const std::deque<std::string> &JsHeapInfo::StrValues() const
{
    return strValues_;
}

size_t JsHeapLocation::AppendNewData(uint32_t fileId,
                                     uint32_t objectIndex,
                                     uint32_t scriptId,
                                     uint32_t line,
                                     uint32_t column)
{
    fileIds_.emplace_back(fileId);
    objectIndexs_.emplace_back(objectIndex);
    scriptIds_.emplace_back(scriptId);
    lines_.emplace_back(line);
    columns_.emplace_back(column);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapLocation::FileIds() const
{
    return fileIds_;
}
const std::deque<uint32_t> &JsHeapLocation::ObjectIndexs() const
{
    return objectIndexs_;
}
const std::deque<uint32_t> &JsHeapLocation::ScriptIds() const
{
    return scriptIds_;
}
const std::deque<uint32_t> &JsHeapLocation::Lines() const
{
    return lines_;
}
const std::deque<uint32_t> &JsHeapLocation::Columns() const
{
    return columns_;
}

size_t JsHeapNodes::AppendNewData(const JsHeapNodesRow &jsHeapNodesRow)
{
    fileIds_.emplace_back(jsHeapNodesRow.fileId);
    nodeIndexs_.emplace_back(jsHeapNodesRow.nodeIndex);
    types_.emplace_back(jsHeapNodesRow.type);
    names_.emplace_back(jsHeapNodesRow.name);
    nodeIds_.emplace_back(jsHeapNodesRow.id);
    selfSizes_.emplace_back(jsHeapNodesRow.selfSize);
    edgeCounts_.emplace_back(jsHeapNodesRow.edgeCount);
    traceNodeIds_.emplace_back(jsHeapNodesRow.traceNodeId);
    detachedNess_.emplace_back(jsHeapNodesRow.detachedNess);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapNodes::FileIds() const
{
    return fileIds_;
}
const std::deque<uint32_t> &JsHeapNodes::NodeIndexs() const
{
    return nodeIndexs_;
}
const std::deque<uint32_t> &JsHeapNodes::Types() const
{
    return types_;
}
const std::deque<uint32_t> &JsHeapNodes::Names() const
{
    return names_;
}
const std::deque<uint32_t> &JsHeapNodes::NodeIds() const
{
    return nodeIds_;
}
const std::deque<uint32_t> &JsHeapNodes::SelfSizes() const
{
    return selfSizes_;
}
const std::deque<uint32_t> &JsHeapNodes::EdgeCounts() const
{
    return edgeCounts_;
}
const std::deque<uint32_t> &JsHeapNodes::TraceNodeIds() const
{
    return traceNodeIds_;
}
const std::deque<uint32_t> &JsHeapNodes::DetachedNess() const
{
    return detachedNess_;
}

size_t JsHeapSample::AppendNewData(uint32_t fileId, uint64_t timeStampUs, uint32_t lastAssignedId)
{
    fileIds_.emplace_back(fileId);
    timeStampUs_.emplace_back(timeStampUs);
    lastAssignedIds_.emplace_back(lastAssignedId);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapSample::FileIds() const
{
    return fileIds_;
}
const std::deque<uint64_t> &JsHeapSample::TimeStampUs() const
{
    return timeStampUs_;
}
const std::deque<uint32_t> &JsHeapSample::LastAssignedIds() const
{
    return lastAssignedIds_;
}

size_t JsHeapString::AppendNewData(uint32_t fileId, uint32_t fileIndex, std::string string)
{
    fileIds_.emplace_back(fileId);
    fileIndexs_.emplace_back(fileIndex);
    strings_.emplace_back(string);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapString::FileIds() const
{
    return fileIds_;
}
const std::deque<uint64_t> &JsHeapString::FileIndexs() const
{
    return fileIndexs_;
}
const std::deque<std::string> &JsHeapString::Strings() const
{
    return strings_;
}

size_t JsHeapTraceFuncInfo::AppendNewData(const JsHeapTraceFuncRow &jsHeapTraceFuncRow)
{
    fileIds_.emplace_back(jsHeapTraceFuncRow.fileId);
    functionIndexs_.emplace_back(jsHeapTraceFuncRow.functionIndex);
    functionIds_.emplace_back(jsHeapTraceFuncRow.functionId);
    names_.emplace_back(jsHeapTraceFuncRow.name);
    scriptNames_.emplace_back(jsHeapTraceFuncRow.scriptName);
    scriptIds_.emplace_back(jsHeapTraceFuncRow.scriptId);
    lines_.emplace_back(jsHeapTraceFuncRow.line);
    columns_.emplace_back(jsHeapTraceFuncRow.column);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::FileIds() const
{
    return fileIds_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::FunctionIndexs() const
{
    return functionIndexs_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::FunctionIds() const
{
    return functionIds_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::Names() const
{
    return names_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::ScriptNames() const
{
    return scriptNames_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::ScriptIds() const
{
    return scriptIds_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::Lines() const
{
    return lines_;
}
const std::deque<uint32_t> &JsHeapTraceFuncInfo::Columns() const
{
    return columns_;
}
size_t JsHeapTraceNode::AppendNewData(const JsHeapTraceNodeRow &jsHeapTraceNodeRow)
{
    fileIds_.emplace_back(jsHeapTraceNodeRow.fileId);
    traceNodeIds_.emplace_back(jsHeapTraceNodeRow.traceNodeId);
    functionInfoIndexs_.emplace_back(jsHeapTraceNodeRow.functionInfoIndex);
    counts_.emplace_back(jsHeapTraceNodeRow.count);
    sizes_.emplace_back(jsHeapTraceNodeRow.size);
    parentIds_.emplace_back(jsHeapTraceNodeRow.parentId);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsHeapTraceNode::FileIds() const
{
    return fileIds_;
}
const std::deque<uint32_t> &JsHeapTraceNode::TraceNodeIDs() const
{
    return traceNodeIds_;
}
const std::deque<uint32_t> &JsHeapTraceNode::FunctionInfoIndexs() const
{
    return functionInfoIndexs_;
}
const std::deque<uint32_t> &JsHeapTraceNode::Counts() const
{
    return counts_;
}
const std::deque<uint32_t> &JsHeapTraceNode::NodeSizes() const
{
    return sizes_;
}
const std::deque<int32_t> &JsHeapTraceNode::ParentIds() const
{
    return parentIds_;
}
size_t JsCpuProfilerNode::AppendNewData(const JsCpuProfilerNodeRow &jsCpuProfilerNodeRow)
{
    functionIds_.emplace_back(jsCpuProfilerNodeRow.functionId);
    functionNames_.emplace_back(jsCpuProfilerNodeRow.functionName);
    scriptIds_.emplace_back(jsCpuProfilerNodeRow.scriptId);
    urls_.emplace_back(jsCpuProfilerNodeRow.url);
    lineNumbers_.emplace_back(jsCpuProfilerNodeRow.lineNumber);
    columnNumbers_.emplace_back(jsCpuProfilerNodeRow.columnNumber);
    hitCounts_.emplace_back(jsCpuProfilerNodeRow.hitCount);
    children_.emplace_back(jsCpuProfilerNodeRow.children);
    parents_.emplace_back(jsCpuProfilerNodeRow.parent);
    ids_.emplace_back(Size());
    return Size() - 1;
}

const std::deque<uint32_t> &JsCpuProfilerNode::FunctionIds() const
{
    return functionIds_;
}
const std::deque<uint32_t> &JsCpuProfilerNode::FunctionNames() const
{
    return functionNames_;
}
const std::deque<std::string> &JsCpuProfilerNode::ScriptIds() const
{
    return scriptIds_;
}
const std::deque<uint32_t> &JsCpuProfilerNode::Urls() const
{
    return urls_;
}
const std::deque<uint32_t> &JsCpuProfilerNode::LineNumbers() const
{
    return lineNumbers_;
}
const std::deque<int32_t> &JsCpuProfilerNode::ColumnNumbers() const
{
    return columnNumbers_;
}
const std::deque<int32_t> &JsCpuProfilerNode::HitCounts() const
{
    return hitCounts_;
}
const std::deque<std::string> &JsCpuProfilerNode::Children() const
{
    return children_;
}
const std::deque<uint32_t> &JsCpuProfilerNode::Parents() const
{
    return parents_;
}

size_t JsCpuProfilerSample::AppendNewData(uint32_t functionId, uint64_t startTime, uint64_t endTime, uint64_t dur)
{
    functionIds_.emplace_back(functionId);
    startTimes_.emplace_back(startTime);
    endTimes_.emplace_back(endTime);
    durs_.emplace_back(dur);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsCpuProfilerSample::FunctionIds() const
{
    return functionIds_;
}
const std::deque<uint64_t> &JsCpuProfilerSample::StartTimes() const
{
    return startTimes_;
}
const std::deque<uint64_t> &JsCpuProfilerSample::EndTimes() const
{
    return endTimes_;
}
const std::deque<uint64_t> &JsCpuProfilerSample::Durs() const
{
    return durs_;
}
size_t JsConfig::AppendNewData(const JsConfigRow &jsConfigRow)
{
    pids_.emplace_back(jsConfigRow.pid);
    types_.emplace_back(jsConfigRow.type);
    intervals_.emplace_back(jsConfigRow.interval);
    captureNumericValues_.emplace_back(jsConfigRow.captureNumericValue);
    trackAllocations_.emplace_back(jsConfigRow.trackAllocation);
    cpuProfilers_.emplace_back(jsConfigRow.cpuProfiler);
    cpuProfilerIntervals_.emplace_back(jsConfigRow.cpuProfilerInterval);
    ids_.emplace_back(Size());
    return Size() - 1;
}
const std::deque<uint32_t> &JsConfig::Pids() const
{
    return pids_;
}
const std::deque<uint64_t> &JsConfig::Types() const
{
    return types_;
}
const std::deque<uint32_t> &JsConfig::Intervals() const
{
    return intervals_;
}
const std::deque<uint32_t> &JsConfig::CaptureNumericValue() const
{
    return captureNumericValues_;
}
const std::deque<uint32_t> &JsConfig::TrackAllocations() const
{
    return trackAllocations_;
}
const std::deque<uint32_t> &JsConfig::CpuProfiler() const
{
    return cpuProfilers_;
}
const std::deque<uint32_t> &JsConfig::CpuProfilerInterval() const
{
    return cpuProfilerIntervals_;
}
} // namespace TraceStdtype
} // namespace SysTuning
