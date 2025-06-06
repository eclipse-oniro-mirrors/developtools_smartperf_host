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

#ifndef SLICE_OBJECT_TABLE_H
#define SLICE_OBJECT_TABLE_H

#include "demo_table_base.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class SliceObjectTable : public DemoTableBase {
public:
    explicit SliceObjectTable(const TraceDataCache *dataCache);
    ~SliceObjectTable() override;
    std::unique_ptr<DemoTableBase::Cursor> CreateCursor() override;

private:
    class Cursor : public DemoTableBase::Cursor {
    public:
        explicit Cursor(const TraceDataCache *dataCache, DemoTableBase *table);
        ~Cursor() override;
        int32_t Column(int32_t sliceObjColumn) const override;

    private:
        const SliceObject &sliceObjectDataObj_;
    };
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // SLICE_OBJECT_TABLE_H
