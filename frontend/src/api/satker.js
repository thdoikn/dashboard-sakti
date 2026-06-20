import apiClient from './client'

export const getSatkerList = (params = {}) =>
  apiClient.get('/satker/', { params })

export const createSatker = (data) =>
  apiClient.post('/satker/', data)

export const updateSatker = (id, data) =>
  apiClient.put(`/satker/${id}/`, data)

export const deleteSatker = (id) =>
  apiClient.delete(`/satker/${id}/`)
