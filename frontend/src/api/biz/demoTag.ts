import request from '@/utils/request'
import type { AjaxResult, TableDataInfo, DemoTagQueryParams, BizDemoTag } from '@/types'

// 查询æ¼”ç¤ºæ ‡ç­¾列表
export function listDemoTag(query: DemoTagQueryParams): Promise<TableDataInfo<BizDemoTag>> {
  return request({
    url: '/biz/demoTag/list',
    method: 'get',
    params: query
  })
}

// 查询æ¼”ç¤ºæ ‡ç­¾详细
export function getDemoTag(tagId: number): Promise<AjaxResult<BizDemoTag>> {
  return request({
    url: '/biz/demoTag/' + tagId,
    method: 'get'
  })
}

// 新增æ¼”ç¤ºæ ‡ç­¾
export function addDemoTag(data: BizDemoTag): Promise<AjaxResult> {
  return request({
    url: '/biz/demoTag',
    method: 'post',
    data: data
  })
}

// 修改æ¼”ç¤ºæ ‡ç­¾
export function updateDemoTag(data: BizDemoTag): Promise<AjaxResult> {
  return request({
    url: '/biz/demoTag',
    method: 'put',
    data: data
  })
}

// 删除æ¼”ç¤ºæ ‡ç­¾
export function delDemoTag(tagId: number | number[]): Promise<AjaxResult> {
  return request({
    url: '/biz/demoTag/' + tagId,
    method: 'delete'
  })
}


