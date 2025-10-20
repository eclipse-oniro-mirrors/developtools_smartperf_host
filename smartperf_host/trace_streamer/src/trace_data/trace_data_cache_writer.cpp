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

#include "trace_data_cache_writer.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace TraceStdtype;
TraceDataCacheWriter::~TraceDataCacheWriter() {}
InternalPid TraceDataCacheWriter::GetProcessInternalPid(uint32_t pid)
{
    internalProcessesData_.emplace_back(pid);
    return static_cast<InternalPid>(internalProcessesData_.size() - 1);
}
Process *TraceDataCacheWriter::GetProcessData(InternalPid internalPid)
{
    TS_ASSERT(internalPid < internalProcessesData_.size());
    return &internalProcessesData_[internalPid];
}

uint32_t TraceDataCacheWriter::AppendNewProcessData(uint32_t pid, const std::string &name, uint64_t startTs)
{
    internalProcessesData_.emplace_back(pid);
    auto &process = internalProcessesData_.back();
    process.cmdLine_ = name;
    process.startT_ = startTs;
    return internalProcessesData_.size() - 1;
}

InternalTid TraceDataCacheWriter::NewInternalThread(uint32_t tid)
{
    internalThreadsData_.emplace_back(tid);
    return static_cast<InternalTid>(internalThreadsData_.size() - 1);
}
Thread *TraceDataCacheWriter::GetThreadData(InternalTid internalTid)
{
    if (internalTid >= internalThreadsData_.size()) {
        return nullptr;
    }
    return &internalThreadsData_[internalTid];
}

void TraceDataCacheWriter::UpdateTraceTime(uint64_t timeStamp)
{
    if (isSplitFile_) {
        return;
    }
    if (timeStamp) {
        traceStartTime_ = std::min(traceStartTime_, timeStamp);
        traceEndTime_ = std::max(traceEndTime_, timeStamp);
    }
}

void TraceDataCacheWriter::UpdateTraceMinTime(uint64_t timestampMin)
{
    if (isSplitFile_) {
        return;
    }
    if (timestampMin) {
        traceStartTime_ = timestampMin;
    }
}

void TraceDataCacheWriter::MixTraceTime(uint64_t timestampMin, uint64_t timestampMax)
{
    if (isSplitFile_) {
        return;
    }
    if (timestampMin == timestampMax) {
        ++timestampMax;
        --timestampMin;
    }
    if (timestampMin == std::numeric_limits<uint64_t>::max() || timestampMax == 0) {
        return;
    }
    if (traceStartTime_ != std::numeric_limits<uint64_t>::max()) {
        traceStartTime_ = std::min(traceStartTime_, timestampMin);
    } else {
        traceStartTime_ = timestampMin;
    }
    if (traceEndTime_) {
        traceEndTime_ = std::max(traceEndTime_, timestampMax);
    } else {
        traceEndTime_ = timestampMax;
    }
}
CallStack *TraceDataCacheWriter::GetInternalSlicesData()
{
    return &callstackData_;
}
CallStack *TraceDataCacheWriter::GetIrqData()
{
    return &irqData_;
}

Filter *TraceDataCacheWriter::GetFilterData()
{
    return &filterData_;
}

Raw *TraceDataCacheWriter::GetRawData()
{
    return &rawData_;
}

Measure *TraceDataCacheWriter::GetMeasureData()
{
    return &measureData_;
}

Measure *TraceDataCacheWriter::GetSysMemMeasureData()
{
    return &sysMemMeasureData_;
}
Measure *TraceDataCacheWriter::GetProcessMeasureData()
{
    return &processMeasureData_;
}
Measure *TraceDataCacheWriter::GetXpowerMeasureData()
{
    return &xpowerMeasureData_;
}
ThreadStateData *TraceDataCacheWriter::GetThreadStateData()
{
    return &threadStateData_;
}

SchedSlice *TraceDataCacheWriter::GetSchedSliceData()
{
    return &schedSliceData_;
}

CpuMeasureFilter *TraceDataCacheWriter::GetCpuMeasuresData()
{
    return &cpuMeasureData_;
}

Instants *TraceDataCacheWriter::GetInstantsData()
{
    return &instantsData_;
}

ProcessMeasureFilter *TraceDataCacheWriter::GetProcessMeasureFilterData()
{
    return &processMeasureFilterData_;
}

ClockEventData *TraceDataCacheWriter::GetClockEventFilterData()
{
    return &clockEventFilterData_;
}

ClkEventData *TraceDataCacheWriter::GetClkEventFilterData()
{
    return &clkEventFilterData_;
}
StatAndInfo *TraceDataCacheWriter::GetStatAndInfo()
{
    return &stat_;
}

MetaData *TraceDataCacheWriter::GetMetaData()
{
    return &metaData_;
}

SymbolsData *TraceDataCacheWriter::GetSymbolsData()
{
    return &symbolsData_;
}
SysCall *TraceDataCacheWriter::GetSysCallData()
{
    return &sysCallData_;
}
LogInfo *TraceDataCacheWriter::GetHilogData()
{
    return &hilogData_;
}

NativeHook *TraceDataCacheWriter::GetNativeHookData()
{
    return &nativeHookData_;
}

NativeHookFrame *TraceDataCacheWriter::GetNativeHookFrameData()
{
    return &nativeHookFrameData_;
}

NativeHookStatistic *TraceDataCacheWriter::GetNativeHookStatisticsData()
{
    return &nativeHookStatisticData_;
}
Hidump *TraceDataCacheWriter::GetHidumpData()
{
    return &hidumpData_;
}
PerfCallChain *TraceDataCacheWriter::GetPerfCallChainData()
{
    return &perfCallChain_;
}
PerfFiles *TraceDataCacheWriter::GetPerfFilesData()
{
    return &perfFiles_;
}
PerfSample *TraceDataCacheWriter::GetPerfSampleData()
{
    return &perfSample_;
}
PerfThread *TraceDataCacheWriter::GetPerfThreadData()
{
    return &perfThread_;
}
PerfReport *TraceDataCacheWriter::GetPerfReportData()
{
    return &perfReport_;
}
PerfNapiAsync *TraceDataCacheWriter::GetPerfNapiAsyncData()
{
    return &perfNapiAsync_;
}
ArgSet *TraceDataCacheWriter::GetArgSetData()
{
    return &argSet_;
}

DataType *TraceDataCacheWriter::GetDataTypeData()
{
    return &dataType_;
}

SysMeasureFilter *TraceDataCacheWriter::GetSysMeasureFilterData()
{
    return &sysEvent_;
}
NetDetailData *TraceDataCacheWriter::GetNetworkData()
{
    return &networkData_;
}
DiskIOData *TraceDataCacheWriter::GetDiskIOData()
{
    return &diskIOData_;
}

CpuUsageDetailData *TraceDataCacheWriter::GetCpuUsageInfoData()
{
    return &cpuUsageData_;
}
LiveProcessDetailData *TraceDataCacheWriter::GetLiveProcessData()
{
    return &liveProcessDetailData_;
}
FileSystemSample *TraceDataCacheWriter::GetFileSystemSample()
{
    return &fileSamplingTableData_;
}
EbpfCallStackData *TraceDataCacheWriter::GetEbpfCallStack()
{
    return &ebpfCallStackData_;
}
PagedMemorySampleData *TraceDataCacheWriter::GetPagedMemorySampleData()
{
    return &pagedMemorySampleData_;
}
HiSysEventSubkeys *TraceDataCacheWriter::GetHiSysEventSubkeysData()
{
    return &sysEventNameIds_;
}
HiSysEventMeasureData *TraceDataCacheWriter::GetHiSysEventMeasureData()
{
    return &sysEventMeasureData_;
}
HiSysEventDeviceStateData *TraceDataCacheWriter::GetHiSysEventDeviceStateData()
{
    return &deviceStateData_;
}
TraceConfig *TraceDataCacheWriter::GetTraceConfigData()
{
    return &traceConfigData_;
}
HiSysEventAllEventData *TraceDataCacheWriter::GetHiSysEventAllEventData()
{
    return &hiSysEventAllEventData_;
}
SmapsData *TraceDataCacheWriter::GetSmapsData()
{
    return &smapsData_;
}
BioLatencySampleData *TraceDataCacheWriter::GetBioLatencySampleData()
{
    return &bioLatencySampleData_;
}

ClockSnapshotData *TraceDataCacheWriter::GetClockSnapshotData()
{
    return &clockSnapshotData_;
}
DataSourceClockIdData *TraceDataCacheWriter::GetDataSourceClockIdData()
{
    return &dataSourceClockIdData_;
}
FrameSlice *TraceDataCacheWriter::GetFrameSliceData()
{
    return &frameSliceData_;
}
FrameMaps *TraceDataCacheWriter::GetFrameMapsData()
{
    return &frameMapsData_;
}

GPUSlice *TraceDataCacheWriter::GetGPUSliceData()
{
    return &gpuSliceData_;
}
DmaFence *TraceDataCacheWriter::GetDmaFenceData()
{
    return &dmaFenceData_;
}
TaskPoolInfo *TraceDataCacheWriter::GetTaskPoolData()
{
    return &taskPoolInfo_;
}
JsHeapFiles *TraceDataCacheWriter::GetJsHeapFilesData()
{
    return &jsHeapFilesData_;
}
JsHeapEdges *TraceDataCacheWriter::GetJsHeapEdgesData()
{
    return &jsHeapEdgesData_;
}
JsHeapInfo *TraceDataCacheWriter::GetJsHeapInfoData()
{
    return &jsHeapInfoData_;
}
JsHeapLocation *TraceDataCacheWriter::GetJsHeapLocationData()
{
    return &jsHeapLocationData_;
}
JsHeapNodes *TraceDataCacheWriter::GetJsHeapNodesData()
{
    return &jsHeapNodesData_;
}
JsHeapSample *TraceDataCacheWriter::GetJsHeapSampleData()
{
    return &jsHeapSampleData_;
}
JsHeapString *TraceDataCacheWriter::GetJsHeapStringData()
{
    return &jsHeapStringData_;
}
JsHeapTraceFuncInfo *TraceDataCacheWriter::GetJsHeapTraceFuncInfoData()
{
    return &jsHeapTraceFuncInfoData_;
}
JsHeapTraceNode *TraceDataCacheWriter::GetJsHeapTraceNodeData()
{
    return &jsHeapTraceNodeData_;
}
JsCpuProfilerNode *TraceDataCacheWriter::GetJsCpuProfilerNodeData()
{
    return &jsCpuProfilerNodeData_;
}
JsCpuProfilerSample *TraceDataCacheWriter::GetJsCpuProfilerSampleData()
{
    return &jsCpuProfilerSampleData_;
}
JsConfig *TraceDataCacheWriter::GetJsConfigData()
{
    return &jsConfigData_;
}
AppStartup *TraceDataCacheWriter::GetAppStartupData()
{
    return &appStartupData_;
}
SoStaticInitalization *TraceDataCacheWriter::GetSoStaticInitalizationData()
{
    return &soStaticInitalizationData_;
}
Animation *TraceDataCacheWriter::GetAnimation()
{
    return &animation_;
}
DeviceInfo *TraceDataCacheWriter::GetDeviceInfo()
{
    return &deviceInfo_;
}
DynamicFrame *TraceDataCacheWriter::GetDynamicFrame()
{
    return &dynamicFrame_;
}
AshMemData *TraceDataCacheWriter::GetAshMemData()
{
    return &ashMemData_;
}
DmaMemData *TraceDataCacheWriter::GetDmaMemData()
{
    return &dmaMemData_;
}
GpuProcessMemData *TraceDataCacheWriter::GetGpuProcessMemData()
{
    return &gpuProcessMemData_;
}
GpuWindowMemData *TraceDataCacheWriter::GetGpuWindowMemData()
{
    return &gpuWindowMemData_;
}
CpuDumpInfo *TraceDataCacheWriter::GetCpuDumpInfo()
{
    return &cpuDumpInfo_;
}
ProfileMemInfo *TraceDataCacheWriter::GetProfileMemInfo()
{
    return &profileMemInfo_;
}
RSImageDumpInfo *TraceDataCacheWriter::GetRSImageDumpInfo()
{
    return &rsImageDumpInfo_;
}
XPowerAppStatistic *TraceDataCacheWriter::GetXPowerAppStatisticInfo()
{
    return &xPowerAppStatisticInfo_;
}
XPowerAppDetailCPU *TraceDataCacheWriter::GetXPowerAppDetailCPUInfo()
{
    return &xPowerAppDetailCPUInfo_;
}
XPowerAppDetailGPU *TraceDataCacheWriter::GetXPowerAppDetailGPUInfo()
{
    return &xPowerAppDetailGPUInfo_;
}
XPowerAppDetailWifi *TraceDataCacheWriter::GetXPowerAppDetailWifiInfo()
{
    return &xPowerAppDetailWifiInfo_;
}
XPowerAppDetailDisplay *TraceDataCacheWriter::GetXPowerAppDetailDisplayInfo()
{
    return &xPowerAppDetailDisplayInfo_;
}
XPowerComponentTop *TraceDataCacheWriter::GetXPowerComponentTopInfo()
{
    return &xPowerComponentTopInfo_;
}
void TraceDataCacheWriter::ClearMeasure()
{
    filterData_.Clear();
    measureData_.Clear();
    cpuMeasureData_.Clear();
    clockEventFilterData_.Clear();
    clkEventFilterData_.Clear();
    processMeasureFilterData_.Clear();
}
void TraceDataCacheWriter::ClearHiperf()
{
    perfSample_.Clear();
    perfCallChain_.Clear();
    perfThread_.Clear();
    perfFiles_.Clear();
    perfReport_.Clear();
}
void TraceDataCacheWriter::ClearArkTs()
{
    jsHeapFilesData_.Clear();
    jsHeapEdgesData_.Clear();
    jsHeapInfoData_.Clear();
    jsHeapLocationData_.Clear();
    jsHeapNodesData_.Clear();
    jsHeapSampleData_.Clear();
    jsHeapStringData_.Clear();
    jsHeapTraceFuncInfoData_.Clear();
    jsHeapTraceNodeData_.Clear();
    jsCpuProfilerNodeData_.Clear();
    jsCpuProfilerSampleData_.Clear();
    jsConfigData_.Clear();
}
void TraceDataCacheWriter::ClearNativeMemory()
{
    nativeHookData_.Clear();
    nativeHookFrameData_.Clear();
}
void TraceDataCacheWriter::ClearBase()
{
    internalProcessesData_.clear();
    internalThreadsData_.clear();
    metaData_.Clear();
    symbolsData_.Clear();
    argSet_.Clear();
    dataType_.Clear();
    dataDict_.Clear();
}
void TraceDataCacheWriter::ClearEbpf()
{
    fileSamplingTableData_.Clear();
    ebpfCallStackData_.Clear();
    pagedMemorySampleData_.Clear();
    bioLatencySampleData_.Clear();
}
void TraceDataCacheWriter::ClearTemplate()
{
    // task pool business
    taskPoolInfo_.Clear();
    // app start up business
    appStartupData_.Clear();
    soStaticInitalizationData_.Clear();
    // animation business
    animation_.Clear();
    deviceInfo_.Clear();
    dynamicFrame_.Clear();
}
void TraceDataCacheWriter::Clear()
{
    ClearBase();
    ClearMeasure();
    ClearHiperf();
    ClearArkTs();
    ClearNativeMemory();
    ClearEbpf();
    ClearTemplate();
    rawData_.Clear();
    threadStateData_.Clear();
    instantsData_.Clear();
    schedSliceData_.Clear();
    callstackData_.Clear();
    irqData_.Clear();
    hilogData_.Clear();
    hidumpData_.Clear();
    sysCallData_.Clear();
    sysEvent_.Clear();
    networkData_.Clear();
    networkDetailData_.Clear();
    cpuUsageData_.Clear();
    diskIOData_.Clear();
    liveProcessDetailData_.Clear();
    sysEventNameIds_.Clear();
    sysEventMeasureData_.Clear();
    deviceStateData_.Clear();
    smapsData_.Clear();
    ashMemData_.Clear();
    dmaMemData_.Clear();
    gpuProcessMemData_.Clear();
    gpuWindowMemData_.Clear();
    gpuSliceData_.Clear();
    dmaFenceData_.Clear();
    frameMapsData_.Clear();
    frameSliceData_.Clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
