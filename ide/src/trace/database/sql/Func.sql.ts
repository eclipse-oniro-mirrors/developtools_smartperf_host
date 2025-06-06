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
import { FuncStruct } from '../ui-worker/ProcedureWorkerFunc';
import { SearchFuncBean } from '../../bean/SearchFuncBean';
import { SelectionData } from '../../bean/BoxSelection';
import { HeapTraceFunctionInfo } from '../../../js-heap/model/DatabaseStruct';
import { FunctionItem } from '../../bean/BinderProcessThread';
import { StateGroup } from '../../bean/StateModle';
import { FuncNameCycle } from '../../bean/BinderProcessThread';
import { Utils } from '../../component/trace/base/Utils';

export const queryFuncNameCycle = (
  funcName: string,
  tIds: string,
  leftNS: number,
  rightNS: number
): Promise<Array<FunctionItem>> =>
  query(
    'queryFuncNameCycle',
    `
        SELECT  
              c.ts - r.start_ts AS cycleStartTime, 
              c.dur,
              c.id,
              t.tid,
              p.pid
            FROM 
                callstack c, trace_range r 
            LEFT JOIN 
                thread t 
            ON 
                c.callid = t.id 
            LEFT JOIN
                process p 
            ON
                t.ipid = p.id  
            WHERE 
                c.name like '${funcName}%' 
            AND 
                t.tid = ${tIds} 
            AND NOT 
                ((cycleStartTime < ${leftNS}) 
            OR 
                ((c.ts - r.start_ts + c.dur) > ${rightNS}))
          `,
    {
      $funcName: funcName,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    },
    { traceId: Utils.currentSelectTrace }
  );

export const querySingleFuncNameCycle = (
  funcName: string,
  tIds: string,
  leftNS: number,
  rightNS: number
): Promise<Array<FunctionItem>> =>
  query(
    'querySingleFuncNameCycle',
    `
      SELECT 
            c.name AS funcName, 
            c.ts - r.start_ts AS cycleStartTime, 
            c.dur AS cycleDur,
            c.id,
            t.tid,
            p.pid,
            c.ts - r.start_ts + c.dur AS endTime
          FROM 
              callstack c, trace_range r 
          LEFT JOIN 
              thread t 
          ON 
              c.callid = t.id 
          LEFT JOIN
              process p 
          ON
              t.ipid = p.id  
          WHERE 
              c.name = '${funcName}'
          AND 
              t.tid = ${tIds} 
          AND NOT 
              ((cycleStartTime < ${leftNS}) 
          OR 
              (endTime > ${rightNS}))
        `,
    {
      $funcName: funcName,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    }
  );

export const queryAllFuncNames = async (traceId?: string): Promise<Array<unknown>> => {
  let list = await query(
    'queryIsColorIndex',
    `select
        colorIndex
      from
        callstack
      limit 1;`,
    {},
    { traceId: traceId, action: 'exec-buf' }
  );
  let isColorIndex = list.length !== 0 ? true : false;
  let colorIndexStr = isColorIndex ? ',colorIndex' : '';
  let allFuncNamesBuffer = await query(
    'queryAllFuncNames',
    `select 
        id,
        name
        ${colorIndexStr} 
      from
        callstack;`,
    {},
    { traceId: traceId, action: 'exec-buf' }
  );
  // @ts-ignore
  return Utils.convertJSON(allFuncNamesBuffer);
};

export const queryProcessAsyncFunc = (
  traceRange: {
    startTs: number;
    endTs: number;
  },
  traceId?: string
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryProcessAsyncFunc',
    `SELECT
      A.tid,
      P.pid,
      c.ts-${traceRange.startTs} as startTs,
      c.dur,
      c.custom_category as category,
      c.id,
      c.depth,
      c.argsetid,
      c.cookie,
      c.trace_level,
      c.trace_tag,
      c.custom_args,
      c.child_callid
    FROM
      (SELECT id, ts, parent_id, dur, depth, argsetid, cookie, custom_category, child_callid, trace_level,
              trace_tag, custom_args from callstack where cookie NOT NULL) c
    LEFT JOIN thread A ON A.id = c.child_callid
    LEFT JOIN process P ON P.id = A.ipid
    WHERE
      startTs NOT NULL;`,
    {},
    { traceId: traceId }
  );

export const queryProcessAsyncFuncCat = (
  traceRange: {
    startTs: number;
    endTs: number;
  }
): Promise<Array<unknown>> =>
  query(
    'queryProcessAsyncFuncCat',
    `
    select 
      A.tid,
      P.pid,   
      c.custom_category as threadName,
      c.name as funName,
      c.ts-${traceRange.startTs} as startTs,
      c.dur,
      c.depth,
      c.cookie,
      c.trace_level,
      c.trace_tag,
      c.custom_args,
      c.child_callid
    from 
      (select callid, name, ts, dur, custom_category, depth, cookie, parent_id,trace_level,trace_tag,
              custom_args,child_callid from callstack where cookie not null and custom_category not null and child_callid is null) c 
		left join 
      thread A on A.id = c.callid
    left join 
      process P on P.id = A.ipid      
    where 
      startTs not null 
    order by custom_category;
  `,
    {}
  );

export const getMaxDepthByTid = (traceId?: string): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'getMaxDepthByTid',
    `SELECT 
      tid,
      ipid,
      maxDepth 
    FROM
      thread T
      LEFT JOIN (
      SELECT
        callid,
        MAX( c.depth + 1 ) AS maxDepth 
      FROM
        callstack C 
      WHERE
        c.ts IS NOT NULL 
        AND c.cookie IS NULL 
      GROUP BY
        callid 
      ) C ON T.id = C.callid 
    WHERE
      maxDepth NOT NULL`,
    {},
    { traceId: traceId }
  );

export const querySearchFuncData = (
  funcName: string,
  tIds: number,
  leftNS: number,
  rightNS: number
): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchFuncData',
    `select 
      c.ts - r.start_ts as startTime,
      c.dur
    from 
      callstack c 
    left join 
      thread t 
    on 
      c.callid = t.id 
    left join 
      process p 
    on 
      t.ipid = p.id
    left join 
      trace_range r
    where 
      c.name like '${funcName}%' 
    and 
      t.tid = ${tIds} 
    and
      not ((startTime < ${leftNS}) or (startTime > ${rightNS}));
      `
  );

export const queryFuncRowData = (funcName: string, tIds: number): Promise<Array<SearchFuncBean>> =>
  query(
    'queryFuncRowData',
    `select 
      c.name as funName,
      c.ts - r.start_ts as startTime,
      t.tid as tid
    from 
      callstack c 
    left join 
      thread t 
    on 
      c.callid = t.id 
    left join 
      process p 
    on 
      t.ipid = p.id
    left join 
      trace_range r
    where 
      c.name like '${funcName}%' 
    and 
      t.tid = ${tIds} 
              `,
    { $search: funcName }
  );

export const fuzzyQueryFuncRowData = (funcName: string, tIds: number):
  Promise<Array<SearchFuncBean>> =>
  query(
    'fuzzyQueryFuncRowData',
    `select 
        c.name as funName,
        c.ts - r.start_ts as startTime,
        c.ts - r.start_ts + c.dur as endTime,
        t.tid as tid
      from 
        callstack c 
      left join 
        thread t 
      on 
        c.callid = t.id 
      left join 
        process p 
      on 
        t.ipid = p.id
      left join 
        trace_range r
      where 
        c.name like '%${funcName}%' 
      and 
        t.tid = ${tIds} 
              `,
    { $search: funcName }
  );

export const getTabSlicesAsyncFunc = (
  asyncNames: string[],
  asyncPid: number,
  asyncTid: number | undefined,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
  let condition = `${asyncTid !== null && asyncTid !== undefined ? `and A.tid = ${asyncTid}` : ''}`;
  let sql = `
    SELECT 
      c.name AS name,
      c.id,
      sum( c.dur ) AS wallDuration,
      count( c.name ) AS occurrences 
      FROM
      (SELECT id, ts, parent_id, dur, name from callstack where cookie NOT NULL) C,
      trace_range D
      LEFT JOIN thread A ON A.id = C.parent_id
      LEFT JOIN process P ON P.id = A.ipid
    where
      C.ts > 0
    and
      c.dur >= -1
    and
      P.pid = ${asyncPid}
    and
      c.name in (${asyncNames.map((it) => '\"' + it + '\"').join(',')})
    and
      not ((C.ts - D.start_ts + C.dur <  ${leftNS}) or (C.ts - D.start_ts > ${rightNS})) ${condition}
    group by
      c.name
    order by
    wallDuration desc;`;
  return query<SelectionData>('getTabSlicesAsyncFunc', sql, {});
};

export const getTabDetails = (
  asyncNames: Array<string>,
  asyncPid: Array<number>,
  funTids: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
  let condition = `
      and A.tid in (${funTids!.join(',')})
      and c.cookie is null
      ${`and P.pid in (${asyncPid.join(',')})`}
      ${`and c.name in (${asyncNames.map((it) => '\"' + it + '\"').join(',')})`}
    `;
  let sql = `
      SELECT 
        c.name AS name,
        c.dur AS duration,
        c.id,
        P.pid AS processId,
        P.name AS process,
        A.tid AS threadId,
        A.name AS thread,
        c.ts - D.start_ts as startNs   
      FROM
        thread A,trace_range D
        LEFT JOIN process P ON P.id = A.ipid
        LEFT JOIN callstack C ON A.id = C.callid
      where
          C.ts > 0
        and
          c.dur >= -1
        and
          not ((C.ts - D.start_ts + C.dur < ${leftNS}) or (C.ts - D.start_ts > ${rightNS})) ${condition}
    `;
  return query('getTabDetails', sql, {});
};
export const getSfDetails = (
  asyncNames: Array<string>,
  asyncPid: number,
  asyncTid: number | undefined,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
  let condition = `
      and c.parent_id not null
      ${asyncTid !== null && asyncTid !== undefined ? `and A.tid = ${asyncTid}` : ''}
      ${`and P.pid = ${asyncPid}`}
      ${`and c.name in (${asyncNames.map((it) => '\"' + it + '\"').join(',')})`}
    `;
  let sql = `
      SELECT 
        c.name AS name,
        c.dur AS duration,
        P.pid AS processId,
        P.name AS process,
        A.tid AS threadId,
        A.name AS thread,
        c.id,
        c.ts - D.start_ts as startNs
        FROM
        (SELECT id, ts, parent_id, dur, name from callstack where cookie NOT NULL) C,
        trace_range D
        LEFT JOIN thread A ON A.id = C.parent_id
        LEFT JOIN process P ON P.id = A.ipid
      where
          C.ts > 0
        and
          c.dur >= -1
        and
          not ((C.ts - D.start_ts + C.dur < ${leftNS}) or (C.ts - D.start_ts > ${rightNS})) ${condition}
    `;
  return query('getSfDetails', sql, {});
};
export const getParentDetail = (
  asyncPid: Array<number>,
  funTids: Array<number>,
  leftNS: number,
  rightNS: number):
  Promise<Array<unknown>> =>
  query(
    'getParentTime',
    ` SELECT
        C.ts - D.start_ts AS startTS,
        C.ts - D.start_ts + C.dur AS endTS,
        C.depth,
        c.id,
        c.name 
      FROM
        thread A
        JOIN trace_range D
        LEFT JOIN process P ON P.id = A.ipid
        LEFT JOIN callstack C ON A.id = C.callid 
      WHERE
        C.ts > 0 
        AND C.dur >= - 1 
        AND NOT (
          ( C.ts - D.start_ts + C.dur < ${leftNS} ) 
          OR ( C.ts - D.start_ts > ${rightNS} ) 
        )
        AND C.cookie IS NULL 
        AND A.tid IN (${funTids!.join(',')}) 
        AND P.pid IN (${asyncPid.join(',')}) 
        `
  );
export const getFuncChildren = (
  funcIds: Array<number>,
  asyncPid: Array<number>,
  funTids: Array<number>,
  leftNS: number,
  rightNS: number,
  isChild: boolean
): //@ts-ignore
  Promise<Array<unknown>> => {
  let durStr = isChild ? 'C.dur AS duration,' : 'SUM(COALESCE(C.dur, 0)) AS duration,';
  let condition = isChild ? '' : 'group by parentName';
  let sql = `
        SELECT 
          c.parent_id parentId,
          ${durStr}
          c.id,
          c.name,
          c1.name parentName
        FROM
          thread A,trace_range D
          LEFT JOIN process P ON P.id = A.ipid
          LEFT JOIN callstack C ON A.id = C.callid
          LEFT JOIN callstack C1 ON c.parent_id = C1.id
        where
            C.ts > 0
          and
            c.dur >= -1
          and
            not ((C.ts - D.start_ts + C.dur < ${leftNS}) or (C.ts - D.start_ts > ${rightNS})) 
          and A.tid in (${funTids!.join(',')})
          and c.cookie is null
          and P.pid in (${asyncPid.join(',')})
          and c.parent_id in (${funcIds.join(',')})${condition}
      `;
  return query('getTabDetails', sql, {});
};
export const getGhDetails = (
  asyncNames: Array<string>,
  catName: string,
  asyncPid: number,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
  let sql = `
        SELECT 
          c.name AS name,
          c.dur AS duration,
          P.pid AS processId,
          P.name AS process,
          A.tid AS threadId,
          A.name AS thread,
          c.ts - D.start_ts as startNs
        FROM
          thread A,trace_range D
          LEFT JOIN process P ON P.id = A.ipid
          LEFT JOIN callstack C ON A.id = C.callid
        where
            C.ts > 0
          and
            c.dur >= -1
          and 
            c.cookie not null
          and 
            c.cat not null
          and 
            c.parent_id is null
          and 
            P.pid = ${asyncPid}
          and
            cat = '${catName}'
          and 
            c.name in (${asyncNames.map((it) => '\"' + it + '\"').join(',')})
          and
          not ((C.ts - D.start_ts + C.dur < ${leftNS}) or (C.ts - D.start_ts > ${rightNS}))
      `;
  return query('getGhDetails', sql, {});
};
export const getTabSlicesAsyncCatFunc = (
  asyncCatNames: string,
  asyncCatPid: number,
  leftNS: number,
  rightNS: number
): Promise<Array<unknown>> =>
  query<SelectionData>(
    'getTabSlicesAsyncCatFunc',
    `
        select
          c.name as name,
          c.id,
          sum(c.dur) as wallDuration,
          count(c.name) as occurrences
        from
          thread A, trace_range D
        left join process P on P.id = A.ipid
        left join callstack C on A.id = C.callid
        where
          C.ts > 0
        and
          c.dur >= -1
        and 
          c.cookie not null
        and
          c.cat not null
        and 
          c.parent_id is null
        and
          P.pid = ${asyncCatPid}
        and
          c.cat = '${asyncCatNames}'
        and
          not ((C.ts - D.start_ts + C.dur < ${leftNS}) or (C.ts - D.start_ts > ${rightNS}))
        group by
          c.name
        order by
          wallDuration desc;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );

export const querySearchFunc = (search: string): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchFunc',
    `
   select c.cookie,
          c.id,
          c.name as funName,
          c.ts - r.start_ts as startTime,
          c.dur,
          c.depth,
          t.tid,
          t.name as threadName,
          p.pid,
          c.argsetid,
          c.trace_level,
          c.trace_tag,
          c.custom_args,
          c.custom_category as category,
          'func' as type 
   from callstack c left join thread t on c.callid = t.id left join process p on t.ipid = p.id
   left join trace_range r 
   where c.name like '%${search}%' and startTime > 0 and cookie IS NULL;
    `,
    { $search: search },
    { traceId: Utils.currentSelectTrace }
  );

  export const querySceneSearchFunc = (search: string, processList: Array<string>):
  Promise<Array<SearchFuncBean>> =>
  query(
    'querySceneSearchFunc',
    `select c.cookie,
          c.id,
          c.name as funName,
          c.ts - r.start_ts as startTime,
          c.dur,
          c.depth,
          t.tid,
          t.name as threadName,
          p.pid,
          c.argsetid,
          c.trace_level,
          c.trace_tag,
          c.custom_args,
          c.custom_category as category,
          'func' as type 
   from callstack c left join thread t on c.callid = t.id left join process p on t.ipid = p.id
   left join trace_range r
   where c.name like "%${search}%" ESCAPE '\\' and startTime > 0 and p.pid in (${processList.join(',')}) 
   and cookie IS NULL;
    `,
    { $search: search },
    { traceId: Utils.currentSelectTrace }
  );

export const queryHeapFunction = (fileId: number): Promise<Array<HeapTraceFunctionInfo>> =>
  query(
    'queryHeapFunction',
    `SELECT 
      function_index as index ,
      function_id as id ,
      name,
      script_name as scriptName,
      script_id as scriptId,
      line,
      column
    FROM js_heap_trace_function_info WHERE file_id = ${fileId}`
  );

export const queryHeapTraceNode = (
  fileId: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryHeapTraceNode',
    `SELECT F.name,
        F.script_name as scriptName,
        F.script_id as scriptId,
        F.column,
        F.line,
        N.id,
        N.function_info_index as functionInfoIndex,
        N.parent_id as parentId,
        N.count,
        N.size,
        IFNULL( S.live_count, 0 ) AS liveCount,
        IFNULL( S.live_size, 0 ) AS liveSize
    FROM
        js_heap_trace_node N
        LEFT JOIN (
            SELECT
                trace_node_id as traceNodeId,
                SUM( self_size ) AS liveSize,
                count( * ) AS liveCount
            FROM
                js_heap_nodes
            WHERE
                file_id = ${fileId}
                AND trace_node_id != 0
            GROUP BY
                trace_node_id
        ) S ON N.id = S.trace_node_id
    LEFT JOIN js_heap_trace_function_info F ON (F.file_id = N.file_id
                AND F.function_index = N.function_info_index)
    WHERE
        N.file_id = ${fileId}
    ORDER BY
        N.id`
  );

export const queryTaskPoolOtherRelationData = (ids: Array<number>, tid: number):
  Promise<Array<FuncStruct>> => {
  let sqlStr = `select
                    c.ts-D.start_ts as startTs,
                    c.dur,
                    c.name as funName,
                    c.argsetid,
                    c.depth,
                    c.id as id,
                    A.itid as itid,
                    A.ipid as ipid
                from thread A,trace_range D
                                  left join callstack C on A.id = C.callid
                where startTs not null and c.cookie is null and tid = $tid and c.id in (${ids.join(',')})`;
  return query('queryTaskPoolOtherRelationData', sqlStr, { $ids: ids, $tid: tid });
};

export const queryTaskPoolRelationData = (ids: Array<number>, tids: Array<number>):
  Promise<Array<FuncStruct>> => {
  let sqlStr = `select
        c.ts-D.start_ts as startTs,
        c.dur,
        c.name as funName,
        c.argsetid,
        c.depth,
        c.id as id,
        A.itid as itid,
        A.ipid as ipid
    from thread A,trace_range D
                      left join callstack C on A.id = C.callid
    where startTs not null and c.cookie is null and c.id in (${ids.join(',')}) and tid in (${tids.join(
    ','
  )})`;
  return query('queryTaskPoolRelationData', sqlStr, { $ids: ids, $tids: tids });
};

export const queryStatesCut = (tIds: Array<number>, leftNS: number, rightNS: number):
  Promise<Array<StateGroup>> =>
  query<StateGroup>(
    'queryBinderByThreadId',
    `
    select
    B.id,
    B.pid,
    B.tid,
    B.dur,
    B.cpu,
    B.state,
    B.ts - C.start_ts AS ts,
    B.dur + B.ts as endTs
  from
    thread_state AS B,trace_range AS C
  where
    B.tid in (${tIds.join(',')})
  and
    ((B.ts + ifnull(B.dur,0) > ($leftStartNs + C.start_ts)) 
    and (B.ts + B.dur < ($rightEndNs + C.start_ts))
  or
    (
      B.ts > ($leftStartNs + C.start_ts) and B.ts < ($rightEndNs + C.start_ts)
  ))
  order by
    B.pid;
        `,
    {
      $tIds: tIds,
      $leftStartNs: leftNS,
      $rightEndNs: rightNS,
    }
  );

export const queryLoopFuncNameCycle = (
  funcName: string,
  tIds: string,
  leftNS: number,
  rightNS: number
): Promise<Array<FuncNameCycle>> =>
  query(
    'queryLoopFuncNameCycle',
    `
        SELECT 
            c.name AS funcName,
            c.ts - r.start_ts AS cycleStartTime,
            0 AS cycleDur,
            c.id,
            t.tid,
            p.pid
          FROM
              callstack c, trace_range r 
            LEFT JOIN 
              thread t 
            ON 
              c.callid = t.id 
            LEFT JOIN  
              process p 
            ON 
              t.ipid = p.id  
          WHERE 
              c.name like '${funcName}%'  
            AND 
              t.tid = ${tIds}
            AND NOT 
              ((cycleStartTime < ${leftNS}) 
            OR  
              (cycleStartTime > ${rightNS})) 
          `,
    {
      $funcName: funcName,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    }
  );

export const querySingleFuncNameCycleStates = (
  funcName: string,
  tIds: string,
  leftNS: number,
  rightNS: number
): Promise<Array<FuncNameCycle>> =>
  query(
    'querySingleFuncNameCycle',
    `
          SELECT 
                c.name AS funcName, 
                c.ts - r.start_ts AS cycleStartTime, 
                c.dur AS cycleDur,
                c.id,
                t.tid,
                p.pid,
                c.ts - r.start_ts + c.dur AS endTime
              FROM 
                  callstack c, trace_range r 
              LEFT JOIN 
                  thread t 
              ON 
                  c.callid = t.id 
              LEFT JOIN
                  process p 
              ON
                  t.ipid = p.id  
              WHERE 
                  c.name like '${funcName}%' 
              AND 
                  t.tid = ${tIds} 
              AND NOT 
                  ((cycleStartTime < ${leftNS}) 
              OR 
                  (endTime > ${rightNS}))
            `,
    {
      $funcName: funcName,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    }
  );
