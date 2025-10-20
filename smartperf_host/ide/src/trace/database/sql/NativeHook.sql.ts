/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { query } from '../SqlLite';
import { NativeHookMalloc, NativeHookProcess, NativeHookSampleQueryInfo } from '../../bean/NativeHook';

export const queryNativeHookResponseTypes = (
  leftNs: number,
  rightNs: number,
  types: Array<string | number>,
  pid: number,
  isStatistic: boolean
): //@ts-ignore
  Promise<Array<unknown>> => {
  const table = isStatistic ? 'native_hook_statistic' : 'native_hook';
  const tsKey = isStatistic ? 'ts' : 'start_ts';
  const type = isStatistic ? 'type' : 'event_type';
  return query(
    'queryNativeHookResponseTypes',
    `
          select 
            distinct last_lib_id as lastLibId,
            data_dict.data as value 
          from 
            ${table} A ,trace_range B
            left join data_dict on A.last_lib_id = data_dict.id 
          where
          A.${tsKey} - B.start_ts
          between ${leftNs} and ${rightNs} and A.${type} in (${types.join(',')})
          and A.ipid = ${pid};
      `,
    { $leftNs: leftNs, $rightNs: rightNs, $types: types, $pid: pid }
  );
};
export const queryNativeHookStatistics = (
  leftNs: number,
  rightNs: number,
  ipid: number
): Promise<Array<NativeHookMalloc>> =>
  query(
    'queryNativeHookStatistics',
    `
    select
      event_type as eventType,
      sub_type_id as subTypeId,
      max(heap_size) as max,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
    from
      native_hook A,
      trace_range B
    where
      (A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}
     and (event_type = 'AllocEvent' or event_type = 'MmapEvent')
     and ipid = ${ipid}
    group by event_type;`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookStatisticsMalloc = (
  leftNs: number,
  rightNs: number,
  ipid: number
): Promise<Array<NativeHookMalloc>> =>
  query(
    'queryNativeHookStatisticsMalloc',
    `
    select
      event_type as eventType,
      heap_size as heapSize,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
    from
      native_hook A,
      trace_range B
    where
      (A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}
    and
      (event_type = 'AllocEvent' or event_type = 'MmapEvent')
    and 
      sub_type_id is null
      and ipid = ${ipid}
    group by
      event_type,
      heap_size
    order by heap_size desc
    `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookStatisticsSubType = (
  leftNs: number,
  rightNs: number,
  ipid: number
): Promise<Array<NativeHookMalloc>> =>
  query(
    'queryNativeHookStatisticsSubType',
    `
    select
      event_type as eventType,
      sub_type_id as subTypeId,
      max(heap_size) as max,
      sum(case when ((NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
      sum(case when ((NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
      sum(case when ((NH.end_ts - TR.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
      sum(case when ((NH.end_ts - TR.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
    from
      native_hook NH,
      trace_range TR
    where
      (NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}
    and
      (event_type = 'MmapEvent')
    and ipid = ${ipid}
    group by
      event_type,sub_type_id;
        `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookSubType = (
  leftNs: number,
  rightNs: number,
  ipid: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryNativeHookSubType',
    `select distinct(
  case when sub_type_id is null  then -1 else sub_type_id end
) as subTypeId,
(case when sub_type_id is null then 'MmapEvent' else DD.data end) as subType
      from
        native_hook NH,
        trace_range TR
      left join data_dict DD on NH.sub_type_id = DD.id
where event_type = 'MmapEvent' and
        (NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}
        and ipid = ${ipid}
        `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookStatisticSubType = (
  leftNs: number,
  rightNs: number,
  ipid: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryNativeHookStatisticSubType',
    `SELECT DISTINCT
      CASE	
      	WHEN
      		NHS.type = 3 
      		AND NHS.sub_type_id IS NOT NULL THEN
      		NHS.sub_type_id ELSE COALESCE( NHS.type, TT.type ) 
      		END AS subTypeId,
      CASE
      	WHEN 
          NHS.type = 2 THEN
      		'FILE_PAGE_MSG' 
      	WHEN 
          NHS.type = 3 
      		AND NHS.sub_type_id IS NOT NULL THEN
      		D.data 
      	WHEN 
          NHS.type = 3 THEN
      		'MEMORY_USING_MSG' ELSE TT.default_name 
      		END AS subType 
      FROM
      			( SELECT 1 AS type, 'MmapEvent' AS default_name UNION ALL SELECT 2, 'FILE_PAGE_MSG' UNION ALL SELECT 3, 'MEMORY_USING_MSG' ) TT
      			LEFT JOIN native_hook_statistic NHS ON TT.type = NHS.type 
      			AND NHS.type IN ( 1, 2, 3 ) 
      			AND EXISTS ( SELECT 1 FROM trace_range TR WHERE ( NHS.ts - TR.start_ts ) BETWEEN ${leftNs} AND ${rightNs} ) 
      			AND NHS.ipid = ${ipid}
      			LEFT JOIN data_dict D ON NHS.sub_type_id = D.id 
      	ORDER BY subTypeId;
      `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookStatisticsCount = (): Promise<Array<{ num: number }>> =>
  query('queryNativeHookStatisticsCount', `select count(1) num from native_hook_statistic`, {});

export const queryStatisticType = (): Promise<Array<{ num: number }>> =>
  query('queryStatisticType', `SELECT 
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 0) AS al,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 1) AS mp,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 2) AS fp,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 3) AS ms;`, {});

export const queryNativeType = (): Promise<Array<{ num: number }>> =>
  query('queryNativeType', `SELECT 
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'AllocEvent') AS AllocEvent,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'FreeEvent') AS FreeEvent,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'MmapEvent') AS MmapEvent,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'MunmapEvent') AS MunmapEvent;`, {});

export const queryNativeHookProcess = (table: string): Promise<Array<NativeHookProcess>> => {
  let sql = `
    select
      distinct ${table}.ipid,
      pid,
      name
    from
      ${table}
    left join
      process p
    on
      ${table}.ipid = p.id
    `;
  return query('queryNativeHookProcess', sql, {});
};

export const queryNativeHookSnapshotTypes = (ipid: number): Promise<Array<NativeHookSampleQueryInfo>> =>
  query(
    'queryNativeHookSnapshotTypes',
    `
select
      event_type as eventType,
      data as subType
    from
      native_hook left join data_dict on native_hook.sub_type_id = data_dict.id
    where
      (event_type = 'AllocEvent' or event_type = 'MmapEvent')
      and ipid = ${ipid}
    group by
      event_type,data;`,
    {}
  );

export const queryAllHookData = (rightNs: number, ipid: number): Promise<Array<NativeHookSampleQueryInfo>> =>
  query(
    'queryAllHookData',
    `
    select
      callchain_id as eventId,
      event_type as eventType,
      data as subType,
      addr,
      heap_size as growth,
      (n.start_ts - t.start_ts) as startTs,
      (n.end_ts - t.start_ts) as endTs
    from
      native_hook n left join data_dict on n.sub_type_id = data_dict.id,
      trace_range t
    where
      (event_type = 'AllocEvent' or event_type = 'MmapEvent')
      and ipid = ${ipid}
    and
      n.start_ts between t.start_ts and ${rightNs} + t.start_ts`,
    { $rightNs: rightNs }
  );
