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
#include "string_help.h"
namespace SysTuning {
namespace base {
char *GetDemangleSymbolIndex(const char *mangled)
{
    int status = 0;
    auto demangle = abi::__cxa_demangle(mangled, nullptr, nullptr, &status);
    if (status) { // status != 0 failed
        return const_cast<char *>(mangled);
    } else {
        return demangle;
    }
}

bool StartWith(const std::string &str, const std::string &res)
{
    if (res.size() > str.size()) {
        return false;
    }
    return str.compare(0, res.length(), res) == 0;
}

bool EndWith(const std::string &str, const std::string &res)
{
    if (res.size() > str.size()) {
        return false;
    }
    return str.compare(str.size() - res.size(), res.size(), res) == 0;
}

std::vector<std::string> SplitStringToVec(const std::string &str, const std::string &pat)
{
    std::vector<std::string> result;
    size_t curPos = 0;
    size_t strSize = str.size();
    size_t patSize = pat.size();
    while (curPos < strSize) {
        auto patPos = str.find(pat, curPos);
        if (patPos == std::string::npos) {
            break;
        }
        result.emplace_back(str.substr(curPos, patPos - curPos));
        curPos = patPos + patSize;
    }
    if (curPos < strSize) {
        result.emplace_back(str.substr(curPos));
    }

    return result;
}
std::string TrimInvisibleCharacters(const std::string &str)
{
    size_t start = 0;
    size_t end = str.length() - 1;
    while (start <= end && !std::isgraph(str[start])) {
        start++;
    }
    while (end >= start && !std::isgraph(str[end])) {
        end--;
    }
    return str.substr(start, end - start + 1);
}

std::string FormatString(const char *p)
{
    std::string str = "\"";
    for (const char *c = p; *c != 0; c++) {
        if (*c == '\\' || *c == '\"') {
            str += "\\";
        }
        str += *c;
    }
    str += "\"";
    return str;
}

std::string Strip(const std::string &str)
{
    std::string blanks = " \f\v\t\r\n";

    auto first = str.find_first_not_of(blanks);
    if (first == std::string::npos) {
        return "";
    }

    auto last = str.find_last_not_of(blanks);
    if (last == std::string::npos) {
        return "";
    }
    return str.substr(first, last - first + 1);
}

std::string StrTrim(const std::string &input)
{
    std::string str = input;
    if (str.empty()) {
        return str;
    }
    str.erase(0, str.find_first_not_of(' '));
    str.erase(str.find_last_not_of(' ') + 1);
    return str;
}

// in-place版本, 直接修改str
void StrTrim(std::string& input)
{
    if (input.empty()) {
        return;
    }
    input.erase(0, input.find_first_not_of(' '));
    input.erase(input.find_last_not_of(' ') + 1);
}

void RemoveNullTerminator(std::string &str)
{
    size_t pos = str.rfind('\0');
    while (pos != std::string::npos) {
        str.erase(pos, 1);
        pos = str.rfind('\0');
    }
}
} // namespace base
} // namespace SysTuning
