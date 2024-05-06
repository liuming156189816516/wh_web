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
export const getResidueNum = (params) => {
  return service({url: '/dp/getResidueNum', method: 'get',params})
}
export const download = (params) => {
  return service({url: '/dp/download', method: 'get',params})
}
export const doOutPutData = (params) => {
  return service({url: '/dp/doOutPutData', method: 'get',params})
}
export const downloadList = (params) => {
  return service({url: '/dp/downloadList', method: 'get',params})
}
export const doOutDownloadRecord = (params) => {
  return service({url: '/dp/doOutDownloadRecord', method: 'get',params})
}
export const setDataPackUseStatus = (data) => {
  return service({url: '/dp/setDataPackUseStatus', method: 'put',data})
}



