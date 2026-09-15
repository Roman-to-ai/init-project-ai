import request from '@/utils/request'
import type { AjaxResult, TableDataInfo, DemoPlanQueryParams, BizDemoPlan } from '@/types'

// 查询演示生产计划列表
export function listDemoPlan(query: DemoPlanQueryParams): Promise<TableDataInfo<BizDemoPlan[]>> {
  return request({
    url: '/biz/demoPlan/list',
    method: 'get',
    params: query
  })
}

// 查询演示生产计划详细
export function getDemoPlan(planId: number): Promise<AjaxResult<BizDemoPlan>> {
  return request({
    url: '/biz/demoPlan/' + planId,
    method: 'get'
  })
}

// 新增演示生产计划
export function addDemoPlan(data: BizDemoPlan): Promise<AjaxResult> {
  return request({
    url: '/biz/demoPlan',
    method: 'post',
    data: data
  })
}

// 修改演示生产计划
export function updateDemoPlan(data: BizDemoPlan): Promise<AjaxResult> {
  return request({
    url: '/biz/demoPlan',
    method: 'put',
    data: data
  })
}

// 删除演示生产计划
export function delDemoPlan(planId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/biz/demoPlan/' + planId,
    method: 'delete'
  })
}


