import searchApiRequest from '@/api-requests/search'
import { useMutation } from '@tanstack/react-query'

export const useSearchUserByEmailMutation = () => {
  return useMutation({
    mutationFn: searchApiRequest.searchUserByEmail
  })
}
