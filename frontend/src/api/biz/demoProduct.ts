import request from '@/utils/request'
import type { AjaxResult, TableDataInfo, DemoProductQueryParams, BizDemoProduct } from '@/types'

// 查询演示产品列表
export function listDemoProduct(query: DemoProductQueryParams): Promise<TableDataInfo<BizDemoProduct[]>> {
  return request({
    url: '/biz/demoProduct/list',
    method: 'get',
    params: query
  })
}

// 查询演示产品详细
export function getDemoProduct(productId: number): Promise<AjaxResult<BizDemoProduct>> {
  return request({
    url: '/biz/demoProduct/' + productId,
    method: 'get'
  })
}

// 新增演示产品
export function addDemoProduct(data: BizDemoProduct): Promise<AjaxResult> {
  return request({
    url: '/biz/demoProduct',
    method: 'post',
    data: data
  })
}

// 修改演示产品
export function updateDemoProduct(data: BizDemoProduct): Promise<AjaxResult> {
  return request({
    url: '/biz/demoProduct',
    method: 'put',
    data: data
  })
}

// 删除演示产品
export function delDemoProduct(productId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/biz/demoProduct/' + productId,
    method: 'delete'
  })
}


