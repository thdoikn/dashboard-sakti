import apiClient from './client'

// Newest-first audit trail. Backend paginates (PAGE_SIZE=50); pass ?page= to
// fetch further pages and ?action=/?search= to filter.
export const getActivityLog = (params = {}) =>
  apiClient.get('/activity-log/', { params })
