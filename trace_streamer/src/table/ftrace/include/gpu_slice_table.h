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

#ifndef GPU_SLICE_TABLE_H
#define GPU_SLICE_TABLE_H

#include "table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class GPUSliceTable : public TableBase {
public:
    explicit GPUSliceTable(const TraceDataCache *dataCache);
    ~GPUSliceTable() override;
    std::unique_ptr<TableBase::Cursor> CreateCursor() override;

private:
    int64_t GetSize() override
    {
        return dataCache_->GetConstGPUSliceData().Size();
    }
    void GetOrbyes(FilterConstraints &gpufc, EstimatedIndexInfo &gpuei) override;
    void FilterByConstraint(FilterConstraints &gpufc,
                            double &gpufilterCost,
                            size_t gpurowCount,
                            uint32_t gpucurrenti) override;

    class Cursor : public TableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, TableBase *table);
        ~Cursor() override;
        int32_t Filter(const FilterConstraints &fc, sqlite3_value **argv) override;
        int32_t Column(int32_t column) const override;

    private:
        const GPUSlice &gpuSliceObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // GPU_SLICE_TABLE_H
