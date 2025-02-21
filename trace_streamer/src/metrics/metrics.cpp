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

#include "metrics.h"
#include <regex>
#include "string_help.h"

namespace SysTuning {
namespace TraceStreamer {
constexpr uint32_t EXTRA_CHAR = 4;
constexpr uint32_t SEND_FINISH = 1;
constexpr uint32_t FUNCTION_ITEM_DUR_MIN = 1;
constexpr uint32_t FUNCTION_ITEM_DUR_MAX = 2;
constexpr uint32_t FUNCTION_ITEM_DUR_AVG = 3;
constexpr uint32_t FUNCTION_ITEM_FUNCTION_NAME = 4;
Metrics ::Metrics()
{
    metricsFunction_ = {
        {TRACE_MEM, std::bind(&Metrics::InitMemoryStrategy, this, std::placeholders::_1)},
        {TRACE_MEM_TOP_TEN, std::bind(&Metrics::InitMemoryStrategy, this, std::placeholders::_1)},
        {TRACE_MEM_UNAGG, std::bind(&Metrics::InitMemoryUnAggStrategy, this, std::placeholders::_1)},
        {TRACE_TASK_NAMES, std::bind(&Metrics::InitMemoryTaskNameStrategy, this, std::placeholders::_1)},
        {TRACE_STATS, std::bind(&Metrics::InitTraceStatsStrategy, this, std::placeholders::_1)},
        {TRACE_METADATA, std::bind(&Metrics::InitTraceMetaDataStrategy, this, std::placeholders::_1)},
        {SYS_CALLS, std::bind(&Metrics::InitSysCallStrategy, this, std::placeholders::_1)}};
    initMetricsMap_ = {
        {METRICS_TRACE_MEM, TRACE_MEM},
        {METRICS_TRACE_MEM_TOP_TEN, TRACE_MEM_TOP_TEN},
        {METRICS_TRACE_MEM_UNAGG, TRACE_MEM_UNAGG},
        {METRICS_TRACE_TASK_NAMES, TRACE_TASK_NAMES},
        {METRICS_TRACE_STATS, TRACE_STATS},
        {METRICS_TRACE_METADATA, TRACE_METADATA},
        {METRICS_SYS_CALLS, SYS_CALLS},
    };
}

void Metrics::ParserJson(const std::string &metrics, std::string &result)
{
    result = result.substr(EXTRA_CHAR, result.size());
    auto it = metricsFunction_.find(metrics);
    if (it == metricsFunction_.end()) {
        TS_LOGE("Not support metrics!");
        return;
    }
    it->second(result);
}

void Metrics::InitMemoryStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    const uint32_t typeInfoItemMax = 0;
    const uint32_t typeInfoItemMin = 1;
    const uint32_t typeInfoItemAvg = 2;
    const uint32_t processMetricesItemsName = 4;
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        TypeInfoItem typeInfoItem;
        typeInfoItem.max = jMessage.at("values")[i].at(typeInfoItemMax);
        typeInfoItem.min = jMessage.at("values")[i].at(typeInfoItemMin);
        typeInfoItem.avg = jMessage.at("values")[i].at(typeInfoItemAvg);
        ProcessMetricsItems processMetricsItems;
        processMetricsItems.overallCounters = typeInfoItem;
        processMetricsItems.processName = jMessage.at("values")[i].at(processMetricesItemsName);
        memStrategy_.emplace_back(std::move(processMetricsItems));
    }
    return;
}
void Metrics::InitMemoryUnAggStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    const uint32_t processValuesItemName = 0;
    const uint32_t namesIndex = 1;
    const uint32_t valuesIndex = 2;
    const uint32_t timesIndex = 3;
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        ProcessValuesItem processValuesItem;
        if (jMessage.at("values")[i].at(0).is_null()) {
            processValuesItem.processName = "";
        } else {
            processValuesItem.processName = jMessage.at("values")[i].at(processValuesItemName);
        }
        auto names = base::SplitStringToVec(jMessage.at("values")[i].at(namesIndex), ",");
        auto values = base::SplitStringToVec(jMessage.at("values")[i].at(valuesIndex), ",");
        auto times = base::SplitStringToVec(jMessage.at("values")[i].at(timesIndex), ",");
        auto oomScoreValue = 0;
        for (auto index = 0; index < names.size(); index++) {
            if (names[index] == "oom_score_adj") {
                oomScoreValue = atoi(values.at(index).c_str());
            }
            TypeItem typeItem;
            typeItem.ts = atoll(times.at(index).c_str());
            typeItem.oomScore = oomScoreValue;
            typeItem.value = atoi(values.at(index).c_str());
            if (names.at(index) == "mem.rss.anon") {
                processValuesItem.anonRss = typeItem;
            } else if (names.at(index) == "mem.swap") {
                processValuesItem.swap = typeItem;
            } else if (names.at(index) == "mem.rss.file") {
                processValuesItem.fileRss = typeItem;
            } else if (names.at(index) == "oom_score_adj") {
                processValuesItem.anonAndSwap = typeItem;
            }
        }
        memAggStrategy_.emplace_back(processValuesItem);
    }
    return;
}
void Metrics::InitMemoryTaskNameStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    const uint32_t jmessageValueSizeOne = 1;
    const uint32_t jmessageValueSizeTwo = 2;
    const uint32_t jmessageValueSizeThree = 3;
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        TaskProcessItem taskProcessItem;
        taskProcessItem.pid = jMessage.at("values")[i].at(jmessageValueSizeOne);
        if (jMessage.at("values")[i].at(jmessageValueSizeTwo).is_null()) {
            taskProcessItem.processName = "";
        } else {
            taskProcessItem.processName = jMessage.at("values")[i].at(jmessageValueSizeTwo);
        }
        if (!jMessage.at("values")[i].at(jmessageValueSizeThree).is_null()) {
            taskProcessItem.threadName =
                base::SplitStringToVec(jMessage.at("values")[i].at(jmessageValueSizeThree), ",");
        }
        taskNameStrategy_.emplace_back(taskProcessItem);
    }
    return;
}
void Metrics::InitTraceStatsStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    const uint32_t statItemName = 0;
    const uint32_t statItemCount = 2;
    const uint32_t statItemSource = 3;
    const uint32_t statItemSeverity = 4;
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        StatItem statItem;
        statItem.name = jMessage.at("values")[i].at(statItemName);
        statItem.count = jMessage.at("values")[i].at(statItemCount);
        statItem.source = jMessage.at("values")[i].at(statItemSource);
        statItem.severity = jMessage.at("values")[i].at(statItemSeverity);
        statStrategy_.emplace_back(statItem);
    }
    return;
}
void Metrics::InitTraceMetaDataStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    const uint32_t traceMetaDataItemName = 0;
    const uint32_t traceMetaDataItemValue = 1;
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        TraceMetadataItem traceMetadataItem;
        traceMetadataItem.name = jMessage.at("values")[i].at(traceMetaDataItemName);
        traceMetadataItem.value = jMessage.at("values")[i].at(traceMetaDataItemValue);
        metaDataStrategy_.emplace_back(traceMetadataItem);
    }
    return;
}
void Metrics::InitSysCallStrategy(const std::string &result)
{
    json jMessage = json::parse(result);
    for (int i = 0; i < jMessage.at("values").size(); i++) {
        FunctionItem functionItem;
        functionItem.functionName = jMessage.at("values")[i].at(FUNCTION_ITEM_FUNCTION_NAME);
        if (!jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_MAX).is_null()) {
            functionItem.durMax = jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_MAX);
        }
        if (!jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_MIN).is_null()) {
            functionItem.durMin = jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_MIN);
        }
        if (!jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_AVG).is_null()) {
            functionItem.durAvg = jMessage.at("values")[i].at(FUNCTION_ITEM_DUR_AVG);
        }
        sysCallStrategy_.emplace_back(functionItem);
    }
    return;
}
void Metrics::PrintMetricsResult(uint32_t metricsIndex, ResultCallBack callback)
{
    std::string res = "\r\n";
    std::string metricsName = "";
    std::string repeateValue = "";
    switch (metricsIndex) {
        case METRICS_TRACE_MEM:
            UpdataRepeateValueByTraceMem(repeateValue, metricsName);
            break;
        case METRICS_TRACE_MEM_TOP_TEN:
            UpdataRepeateValueByTopTen(repeateValue, metricsName);
            break;
        case METRICS_TRACE_MEM_UNAGG:
            UpdataRepeateValueByMemUnagg(repeateValue, metricsName);
            break;
        case METRICS_TRACE_TASK_NAMES:
            UpdataRepeateValueByTaskNames(repeateValue, metricsName);
            break;
        case METRICS_TRACE_STATS:
            UpdataRepeateValueByStats(repeateValue, metricsName);
            break;
        case METRICS_TRACE_METADATA:
            UpdataRepeateValueByMetadata(repeateValue, metricsName);
            break;
        case METRICS_SYS_CALLS:
            UpdataRepeateValueBySysCalls(repeateValue, metricsName);
            break;
        default:
            break;
    }
    if (repeateValue != "") {
        repeateValue.pop_back();
    }
    res += metricsName + ": {" + repeateValue + "}";
    res = JsonFormat(res) + "\r\n";
    std::regex strRegex(",");
    auto str = std::regex_replace(res, strRegex, "");
#ifndef IS_WASM
    printf("%s", str.c_str());
#else
    callback(str, SEND_FINISH);
#endif
    return;
}
void Metrics::UpdataRepeateValueByTraceMem(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_MEM;
    for (auto item : memStrategy_) {
        repeateValue += PROCESS_METRICES + PROCESS_NAME + "\"" + item.processName + "\"," + OVERALL_COUNTERS +
                        ANON_RSS + MIN + std::to_string(item.overallCounters.min) + "," + MAX +
                        std::to_string(item.overallCounters.max) + "," + AVG +
                        std::to_string(item.overallCounters.avg) + "}}},";
    }
}
void Metrics::UpdataRepeateValueByTopTen(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_MEM_TOP_TEN;
    for (auto item : memStrategy_) {
        repeateValue += PROCESS_METRICES + PROCESS_NAME + "\"" + item.processName + "\"," + OVERALL_COUNTERS +
                        ANON_RSS + MIN + std::to_string(item.overallCounters.min) + "," + MAX +
                        std::to_string(item.overallCounters.max) + "," + AVG +
                        std::to_string(item.overallCounters.avg) + "}}},";
    }
}
void Metrics::UpdataRepeateValueByMemUnagg(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_MEM_UNAGG;
    for (auto item : memAggStrategy_) {
        repeateValue += PROCESS_VALUES + PROCESS_NAME + "\"" + item.processName + "\"," + ANON_RSS + TS +
                        std::to_string(item.anonRss.ts) + "," + OOM_SCORE + std::to_string(item.anonRss.oomScore) +
                        "," + VALUE + std::to_string(item.anonRss.value) + "}," + FILE_RSS + TS +
                        std::to_string(item.fileRss.ts) + "," + OOM_SCORE + std::to_string(item.fileRss.oomScore) +
                        "," + VALUE + std::to_string(item.fileRss.value) + "}," + SWAP + TS +
                        std::to_string(item.swap.ts) + "," + OOM_SCORE + std::to_string(item.swap.oomScore) + "," +
                        VALUE + std::to_string(item.swap.value) + "}},";
    }
}
void Metrics::UpdataRepeateValueByTaskNames(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_TASK_NAMES;
    for (auto item : taskNameStrategy_) {
        repeateValue += PROCESS + PID + std::to_string(item.pid) + "," + PROCESS_NAME + "\"" + item.processName + "\",";
        for (auto threadItem : item.threadName) {
            repeateValue += THREAD_NAME + "\"" + threadItem + "\",";
        }
        repeateValue.pop_back();
        repeateValue += "},";
    }
}
void Metrics::UpdataRepeateValueByStats(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_STATS;
    for (auto item : statStrategy_) {
        repeateValue += STAT + NAME + "\"" + item.name + "\"," + COUNT + std::to_string(item.count) + "," + SOURCE +
                        "\"" + item.source + "\"," + SEVERITY + "\"" + item.severity + "\"" + "},";
    }
}
void Metrics::UpdataRepeateValueByMetadata(std::string &repeateValue, std::string &metricsName)
{
    metricsName = TRACE_METADATA;
    for (auto item : metaDataStrategy_) {
        repeateValue +=
            TRACE_METADATA + ":{" + NAME + "\"" + item.name + "\"," + VALUE + "\"" + item.value + "\"" + "},";
    }
}
void Metrics::UpdataRepeateValueBySysCalls(std::string &repeateValue, std::string &metricsName)
{
    metricsName = SYS_CALLS;
    for (auto item : sysCallStrategy_) {
        repeateValue += FUNCTION + FUNCTION_NAME + "\"" + item.functionName + "\"," + DUR_MAX +
                        std::to_string(item.durMax) + "," + DUR_MIN + std::to_string(item.durMin) + "," + DUR_AVG +
                        std::to_string(item.durAvg) + "},";
    }
}
std::string Metrics::GetLevelSpace(int level)
{
    std::string levelStr = "";
    for (int i = 0; i < level; i++) {
        levelStr += "    ";
    }
    return levelStr;
}
std::string Metrics::JsonFormat(std::string json)
{
    std::string result = "";
    int level = 0;
    for (std::string::size_type index = 0; index < json.size(); index++) {
        char value = json[index];
        if (level > 0 && json[json.size() - 1] == '\n') {
            result += GetLevelSpace(level);
        }
        switch (value) {
            case '{':
            case '[':
                result = result + value + "\n";
                level++;
                result += GetLevelSpace(level);
                break;
            case ',':
                result = result + value + "\n";
                result += GetLevelSpace(level);
                break;
            case '}':
            case ']':
                result += "\n";
                level--;
                result += GetLevelSpace(level);
                result += value;
                break;
            default:
                result += value;
                break;
        }
    }
    return result;
}
} // namespace TraceStreamer
} // namespace SysTuning
