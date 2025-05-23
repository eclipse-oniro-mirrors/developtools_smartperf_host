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

#ifndef FILTER_TABLE_H
#define FILTER_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class FilterTable : public TableBase {
public:
    enum Column { ID = 0, TYPE = 1, NAME = 2, ARG_ID = 3 };
    explicit FilterTable(const TraceDataCache *dataCache);
    ~FilterTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->GetConstFilterData().Size();
    }
    void GetOrbyes(FilterConstraints &filterfc, EstimatedIndexInfo &filterei) override;
    void FilterByConstraint(FilterConstraints &filterfc,
                            double &filterfilterCost,
                            size_t filterrowCount,
                            uint32_t filtercurrenti) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        int32_t Filter(const FilterConstraints &fc, sqlite3_value **argv) override;
        int32_t Column(int32_t col) const override;

    private:
        const TraceStreamer::Filter &filterObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // FILTER_TABLE_H
