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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>

#include "rpc/rpc_server.h"
#include "print_event_parser.h"

using namespace testing::ext;
namespace SysTuning {
namespace TraceStreamer {
class RpcServerTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }
    void TearDown() {}

public:
    TraceStreamerSelector stream_ = {};
};
std::string g_result;
void res(const std::string result, int32_t finish)
{
    TS_LOGI("%s", result.c_str());
    g_result = result;
}

/**
 * @tc.name: CorrectTraceData
 * @tc.desc: Upload correct trace file data
 * @tc.type: FUNC
 */
HWTEST_F(RpcServerTest, CorrectTraceData, TestSize.Level1)
{
    TS_LOGI("test27-1");
    std::string PARSERDATA("sugov:0-178   (  178) [001] .... 28462.257501: cpu_frequency: state=816000 cpu_id=0 \n");
    std::string SQLQUERY("select * from measure;");

    RpcServer rpcServer;
    auto ret = rpcServer.ParseData((const uint8_t *)PARSERDATA.c_str(), PARSERDATA.length(), res, 0);
    EXPECT_TRUE(res);
    EXPECT_TRUE(ret);
    ret = rpcServer.ParseDataOver((const uint8_t *)PARSERDATA.c_str(), PARSERDATA.length(), res);
    EXPECT_TRUE(res);
    EXPECT_TRUE(ret);
    ret = rpcServer.SqlQuery((const uint8_t *)SQLQUERY.c_str(), SQLQUERY.length(), res);
    EXPECT_TRUE(res);
    EXPECT_TRUE(ret);
}

/**
 * @tc.name: WrongTraceData
 * @tc.desc: Upload wrong tracking file data
 * @tc.type: FUNC
 */
HWTEST_F(RpcServerTest, WrongTraceData, TestSize.Level1)
{
    TS_LOGI("test27-2");
    std::string PARSERDATA("sugov:0-178   (  178) [001] .... 28462.277458: cpu_frequency: state=600000 cpu_id=2 \n");
    std::string SQLQUERY("select * from measure_e;");

    RpcServer rpcServer;
    auto ret = rpcServer.ParseData((const uint8_t *)PARSERDATA.c_str(), PARSERDATA.length(), res, 0);
    EXPECT_TRUE(res);
    EXPECT_TRUE(ret);
    ret = rpcServer.ParseDataOver((const uint8_t *)PARSERDATA.c_str(), PARSERDATA.length(), res);
    EXPECT_TRUE(res);
    EXPECT_TRUE(ret);
    ret = rpcServer.SqlQuery((const uint8_t *)SQLQUERY.c_str(), SQLQUERY.length(), res);
    EXPECT_TRUE(g_result == "dberror\r\n");
    EXPECT_FALSE(ret);
}

/**
 * @tc.name: ParserConfig
 * @tc.desc: Test the ParserConfig method
 * @tc.type: FUNC
 */
HWTEST_F(RpcServerTest, ParserConfig, TestSize.Level1)
{
    TS_LOGI("test27-3");
    std::string comm("e.myapplication");
    uint64_t ts = 89227707307481;
    uint32_t pid = 16502;
    std::string event("B|16502|H:Task Allocation: taskId : 1, executeId : 9, priority : 9, executeState : 1");
    BytraceLine line;
    // if the configuration changes, the current variable also needs to change
    std::string json(
        "{\"config\": {"
        "\"TaskPool\": 1,\"AnimationAnalysis\": 0,\"AppStartup\": 0, \"BinderRunnable\": 0, \"FfrtConvert\": "
        "0,\"HMKernel\":0"
        "}}");

    RpcServer rpcServer;
    auto ret = rpcServer.ParserConfig(json);
    EXPECT_EQ(rpcServer.ts_->traceDataCache_->taskPoolTraceEnabled_, true);
    PrintEventParser printEvent(rpcServer.ts_->traceDataCache_.get(), rpcServer.ts_->streamFilters_.get());
    printEvent.ParsePrintEvent(comm, ts, pid, event, line);
    auto res = rpcServer.ts_->traceDataCache_->GetConstTaskPoolData().prioritys_[0];
    EXPECT_EQ(res, 9);
}
} // namespace TraceStreamer
} // namespace SysTuning
