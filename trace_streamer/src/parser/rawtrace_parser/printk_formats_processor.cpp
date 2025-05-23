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
#include "printk_formats_processor.h"

#include <sstream>
#include "string_help.h"
#include "string_to_numerical.h"

namespace SysTuning {
namespace TraceStreamer {
PrintkFormatsProcessor &PrintkFormatsProcessor::GetInstance()
{
    static PrintkFormatsProcessor instance;
    return instance;
}

PrintkFormatsProcessor::PrintkFormatsProcessor() {}

PrintkFormatsProcessor::~PrintkFormatsProcessor() {}

std::string PrintkFormatsProcessor::GetSymbol(uint64_t addr)
{
    auto iter = printkFormatsDict_.find(addr);
    if (iter != printkFormatsDict_.end()) {
        return iter->second;
    }
    auto addrStr = "0x" + base::number(addr, base::INTEGER_RADIX_TYPE_HEX);
    TS_LOGD("can't find %s(addr) sym!", addrStr.data());
    return addrStr;
}

bool PrintkFormatsProcessor::HandlePrintkSyms(const std::string &printkFormats)
{
    std::stringstream prinktkFormatStream(printkFormats);
    std::string curLine;
    uint64_t addr = 0;
    std::string curSymbol = "";
    while (std::getline(prinktkFormatStream, curLine)) {
        auto pos = curLine.find(':');
        if (pos == std::string::npos) {
            continue;
        }
        std::string addrInfo = base::Strip(curLine.substr(0, pos));
        addr = base::StrToInt<uint64_t>(addrInfo, base::INTEGER_RADIX_TYPE_HEX).value();
        curSymbol = base::Strip(curLine.substr(pos + 1));
        if (curSymbol.back() == '"') {
            curSymbol.pop_back();
        }
        if (curSymbol.front() == '"') {
            curSymbol = curSymbol.substr(1);
        }
        printkFormatsDict_[addr] = curSymbol;
    }
    TS_LOGI("printkFormatsDict_ size = %zu", printkFormatsDict_.size());
    return printkFormatsDict_.size() > 0;
}
void PrintkFormatsProcessor::Clear()
{
    printkFormatsDict_.clear();
}
} // namespace TraceStreamer
} // namespace SysTuning
