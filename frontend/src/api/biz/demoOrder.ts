import request from '@/utils/request'
import type { AjaxResult, TableDataInfo, DemoOrderQueryParams, BizDemoOrder } from '@/types'

// 查询演示工单列表
export function listDemoOrder(query: DemoOrderQueryParams): Promise<TableDataInfo<BizDemoOrder[]>> {
  return request({
    url: '/biz/demoOrder/list',
    method: 'get',
    params: query
  })
}

// 查询演示工单详细
export function getDemoOrder(orderId: number): Promise<AjaxResult<BizDemoOrder>> {
  return request({
    url: '/biz/demoOrder/' + orderId,
    method: 'get'
  })
}

// 新增演示工单
export function addDemoOrder(data: BizDemoOrder): Promise<AjaxResult> {
  return request({
    url: '/biz/demoOrder',
    method: 'post',
    data: data
  })
}

// 修改演示工单
export function updateDemoOrder(data: BizDemoOrder): Promise<AjaxResult> {
  return request({
    url: '/biz/demoOrder',
    method: 'put',
    data: data
  })
}

// 删除演示工单
export function delDemoOrder(orderId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/biz/demoOrder/' + orderId,
    method: 'delete'
  })
}


