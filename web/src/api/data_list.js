import service from '@/utils/request'

export const getDataList = (params) => {
  return service({url: '/dp/getDataPackList', method: 'get',params})
}
export const createDataPack = (data) => {
  return service({url: '/dp/createDataPack', method: 'post',data})
}
export const deleteDataPack = (data) => {
  return service({url: '/dp/deleteDataPack', method: 'delete',data})
}
export const deleteDataPackByIds = (data) => {
  return service({url: '/dp/deleteDataPackByIds', method: 'delete',data})
}
export const findDataPack = (data) => {
  return service({url: '/dp/findDataPack', method: 'get',data})
}

export const upload = (data) => {
  return service({url: '/fileUploadAndDownload/upload', method: 'post',data})
}

// export const deleteDataPackByIds = (data) => {
//   return service({url: '/dp/deleteDataPackByIds', method: 'post',data})
// }