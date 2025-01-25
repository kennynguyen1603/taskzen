// Định nghĩa kiểu lỗi cho API response
export interface ErrorPayload {
    message: string
    errors: {
        [key: string]: {
            type: string
            value: string
            msg: string
            path: string
            location: string
        }
    }
}
