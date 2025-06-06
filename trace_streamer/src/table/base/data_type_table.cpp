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

#include "data_type_table.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t { ID = 0, TYPEID, DESC };
DataTypeTable::DataTypeTable(const TraceDataCache *dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("typeId", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("desc", "TEXT"));
    tablePriKey_.push_back("id");
}

DataTypeTable::~DataTypeTable() {}

std::unique_ptr<TableBase::Cursor> DataTypeTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

DataTypeTable::Cursor::Cursor(const TraceDataCache *dataCache, TableBase *table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstDataTypeData().Size())),
      dataTypeObj_(dataCache->GetConstDataTypeData())
{
}

DataTypeTable::Cursor::~Cursor() {}

int32_t DataTypeTable::Cursor::Filter(const FilterConstraints &fc, sqlite3_value **argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto &dataTypeTabCs = fc.GetConstraints();
    for (size_t i = 0; i < dataTypeTabCs.size(); i++) {
        const auto &c = dataTypeTabCs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            default:
                break;
        }
    }

    auto dataTypeTabOrderbys = fc.GetOrderBys();
    for (auto i = dataTypeTabOrderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(dataTypeTabOrderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(dataTypeTabOrderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t DataTypeTable::Cursor::Column(int32_t col) const
{
    switch (static_cast<Index>(col)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<sqlite3_int64>(CurrentRow()));
            break;
        case Index::TYPEID:
            sqlite3_result_int64(context_, static_cast<int64_t>(dataTypeObj_.DataTypes()[CurrentRow()]));
            break;
        case Index::DESC:
            sqlite3_result_text(context_, dataCache_->GetDataFromDict(dataTypeObj_.DataDesc()[CurrentRow()]).c_str(),
                                STR_DEFAULT_LEN, nullptr);
            break;
        default:
            TS_LOGF("Unknown column %d", col);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
