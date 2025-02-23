import accountApiRequest from '@/api-requests/account'
import { useMutation } from '@tanstack/react-query'

export const useGetMeMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.me
  })
}
