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

#include "wasm_func.h"
#include <deque>
#include "version.h"
#include "sdk_data_parser.h"
#include "sdk_plugin_data_parser.h"
#include "demo_table_base.h"
#include "trace_stdtype.h"
#include "ts_sdk_api.h"

namespace SysTuning {
namespace TraceStreamer {
DemoRpcServer g_demoWasmTraceStreamer;

extern "C" {
using QueryResultCallbackFunction = void (*)(const char *data, uint32_t len, int32_t finish, int32_t isConfig);
using TraceRangeCallbackFunction = void (*)(const char *data, uint32_t len);
QueryResultCallbackFunction g_reply;
TraceRangeCallbackFunction g_traceRange;
uint8_t *g_reqBuf;
uint32_t g_reqBufferSize;
uint8_t *g_traceRangeBuf;
uint32_t g_traceRangeSize;
uint8_t *g_pluginNameBuf;
uint32_t g_pluginNameSize;

void QueryResultCallback(const std::string &jsonResult, int32_t finish, int32_t isConfig)
{
    g_reply(jsonResult.data(), jsonResult.size(), finish, isConfig);
}
void TraceRangeCallback(const std::string &jsonResult)
{
    g_traceRange(jsonResult.data(), jsonResult.size());
}
EMSCRIPTEN_KEEPALIVE uint8_t *Init(QueryResultCallbackFunction queryResultCallbackFunction, uint32_t reqBufferSize)
{
    SetRpcServer(&g_demoWasmTraceStreamer);
    SDKPluginIinitTableName();
    g_demoWasmTraceStreamer.demoTs_->sdkDataParser_->CreateTableByJson();
    g_reply = queryResultCallbackFunction;
    g_reqBuf = new uint8_t[reqBufferSize];
    g_reqBufferSize = reqBufferSize;
    return g_reqBuf;
}

// Get PluginName
EMSCRIPTEN_KEEPALIVE uint8_t *InitPluginName(uint32_t reqBufferSize)
{
    g_pluginNameBuf = new uint8_t[reqBufferSize];
    g_pluginNameSize = reqBufferSize;
    return g_pluginNameBuf;
}

// @deprecated recommand to use TraceStreamerGetPluginNameEx api
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerInPluginName(const uint8_t *pluginName, int32_t len)
{
    std::string pluginNameStr(reinterpret_cast<const char *>(pluginName), len);
    g_demoWasmTraceStreamer.demoTs_->sdkDataParser_->GetPluginName(pluginNameStr);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerGetPluginNameEx(int32_t pluginLen)
{
    return g_demoWasmTraceStreamer.DemoWasmGetPluginNameWithCallback(g_pluginNameBuf, pluginLen);
}

EMSCRIPTEN_KEEPALIVE uint8_t *InitTraceRange(TraceRangeCallbackFunction traceRangeCallbackFunction,
                                             uint32_t reqBufferSize)
{
    g_traceRange = traceRangeCallbackFunction;
    g_traceRangeBuf = new uint8_t[reqBufferSize];
    g_traceRangeSize = reqBufferSize;
    return g_traceRangeBuf;
}

// The whole file is parsed, and the third party is notified by JS
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamer_In_ParseDataOver()
{
    MetaData *metaData = g_demoWasmTraceStreamer.demoTs_->GetMetaData();
    metaData->InitMetaData();
    metaData->SetParserToolVersion(SDK_VERSION);
    metaData->SetParserToolPublishDateTime(SDK_PUBLISH_VERSION);
    g_demoWasmTraceStreamer.demoTs_->sdkDataParser_->ParseDataOver(&TraceRangeCallback);
    return 0;
}

// Get Json configuration interface
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamer_In_JsonConfig()
{
    g_demoWasmTraceStreamer.demoTs_->sdkDataParser_->GetJsonConfig(&QueryResultCallback);
    return 0;
}

EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlOperate(const uint8_t *sql, int32_t sqlLen)
{
    if (g_demoWasmTraceStreamer.DemoSqlOperate(sql, sqlLen, nullptr)) {
        return 0;
    }
    return -1;
}
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlOperateEx(int32_t sqlLen)
{
    if (g_demoWasmTraceStreamer.DemoSqlOperate(g_reqBuf, sqlLen, nullptr)) {
        return 0;
    }
    return -1;
}

// JS calls third-party parsing interface
EMSCRIPTEN_KEEPALIVE int32_t ParserData(int32_t len, int32_t componentId)
{
    g_demoWasmTraceStreamer.demoTs_->sdkDataParser_->ParserData(g_reqBuf, len, componentId);
    return 0;
}

// return the length of result, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlQuery(const uint8_t *sql, int32_t sqlLen, uint8_t *out, int32_t outLen)
{
    return g_demoWasmTraceStreamer.DemoWasmSqlQuery(sql, sqlLen, out, outLen);
}
// return the length of result, -1 while failed
EMSCRIPTEN_KEEPALIVE int32_t TraceStreamerSqlQueryEx(int32_t sqlLen)
{
    return g_demoWasmTraceStreamer.DemoWasmSqlQueryWithCallback(g_reqBuf, sqlLen, &QueryResultCallback);
}

} // extern "C"
} // namespace TraceStreamer
} // namespace SysTuning
