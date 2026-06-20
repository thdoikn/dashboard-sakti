import apiClient from './client'

export const getAnggaran = (params = {}) =>
  apiClient.get('/anggaran/', { params })

export const getRealisasi = (params = {}) =>
  apiClient.get('/realisasi/', { params })

export const getCapaianRO = (params = {}) =>
  apiClient.get('/capaian-ro/', { params })

export const getSyncStatus = () =>
  apiClient.get('/sync-status/')

export const exportExcel = (params = {}) =>
  apiClient.get('/export/excel/', {
    params,
    responseType: 'blob',
  })
