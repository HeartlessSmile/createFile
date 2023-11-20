import axios from '@/request/http' // 导入http中创建的axios实例
import qs from 'qs'
import { base } from '../../static/globaljs/global.js' // 根据需求是否导入qs模块

const API = {
  // 列表
  list(params) {
    return axios.get(`${base.sq + base.version}/list?` + qs.stringify(params))
  },
  edit(params) {
    return axios.post(`${base.sq + base.version}/edit`, params)
  },
  add(params) {
    return axios.post(`${base.sq + base.version}/add`, params)
  },
  del(params) {
    return axios.post(`${base.sq + base.version}/del`, params)
  },
}

export default API
