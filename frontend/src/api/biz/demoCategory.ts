import request from '@/utils/request'
import type { AjaxResult, TableDataInfo, DemoCategoryQueryParams, BizDemoCategory } from '@/types'

// 查询演示产品分类列表
export function listDemoCategory(query?: DemoCategoryQueryParams): Promise<AjaxResult<BizDemoCategory[]>> {
  return request({
    url: '/biz/demoCategory/list',
    method: 'get',
    params: query
  })
}

// 查询演示产品分类详细
export function getDemoCategory(categoryId: number): Promise<AjaxResult<BizDemoCategory>> {
  return request({
    url: '/biz/demoCategory/' + categoryId,
    method: 'get'
  })
}

// 新增演示产品分类
export function addDemoCategory(data: BizDemoCategory): Promise<AjaxResult> {
  return request({
    url: '/biz/demoCategory',
    method: 'post',
    data: data
  })
}

// 修改演示产品分类
export function updateDemoCategory(data: BizDemoCategory): Promise<AjaxResult> {
  return request({
    url: '/biz/demoCategory',
    method: 'put',
    data: data
  })
}

// 删除演示产品分类
export function delDemoCategory(categoryId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/biz/demoCategory/' + categoryId,
    method: 'delete'
  })
}


