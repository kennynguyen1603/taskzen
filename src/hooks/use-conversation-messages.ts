import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMessages } from '@/api-requests/messages'
import { useEffect } from 'react'

export const useConversationMessages = (conversationId: string | null) => {
    const queryClient = useQueryClient()

    // Trả về null/empty nếu chưa chọn conversation
    if (!conversationId) {
        return {
            messages: [],
            isLoading: false,
            isError: false,
            error: null
        }
    }

    const { data: messages, isLoading, isError, error } = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: () => fetchMessages(conversationId),
        staleTime: 10000, // Giữ data trong 10 giây trước khi coi là stale
        refetchOnWindowFocus: false,
        enabled: !!conversationId
    })

    // Đảm bảo invalidate query khi conversation thay đổi để buộc fetch lại data
    useEffect(() => {
        return () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
        }
    }, [conversationId, queryClient])

    return {
        messages: messages || [],
        isLoading,
        isError,
        error
    }
} 