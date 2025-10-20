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
#include "ts_sdk_api.h"
namespace SysTuning {
namespace TraceStreamer {
extern "C" {
DemoRpcServer *rpcServer_;
bool g_isUseExternalModify = true;
int32_t SDKSetTableName(const char *counterTableName,
                        const char *counterObjectTableName,
                        const char *sliceTableName,
                        const char *sliceObjectName)
{
    rpcServer_->demoTs_->sdkDataParser_->SetTableName(counterTableName, counterObjectTableName, sliceTableName,
                                                      sliceObjectName);
    if (g_isUseExternalModify) {
        TS_LOGE("If you want to use the SDKSetTableName, please modify g_isUseExternalModify to false.");
    }
    return 0;
}

int32_t SDKAppendCounterObject(int32_t counterId, const char *columnName)
{
    return rpcServer_->demoTs_->sdkDataParser_->AppendCounterObject(counterId, columnName);
}
int32_t SDKAppendCounter(int32_t counterId, uint64_t ts, int32_t value)
{
    return rpcServer_->demoTs_->sdkDataParser_->AppendCounter(counterId, ts, value);
}
int32_t SDKAppendSliceObject(int32_t sliceId, const char *columnName)
{
    return rpcServer_->demoTs_->sdkDataParser_->AppendSliceObject(sliceId, columnName);
}
int32_t SDKAppendSlice(int32_t sliceId, uint64_t ts, uint64_t endTs, int32_t value)
{
    return rpcServer_->demoTs_->sdkDataParser_->AppendSlice(sliceId, ts, endTs, value);
}
void SetRpcServer(DemoRpcServer *rpcServer)
{
    rpcServer_ = std::move(rpcServer);
}
}
} // namespace TraceStreamer
} // namespace SysTuning
