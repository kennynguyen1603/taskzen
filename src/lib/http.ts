import envConfig from '@/config/evn.config';
import {
  getAccessTokenFromLocalStorage,
  normalizePath,
  removeTokensFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from '@/lib/utils';
import { LoginResType } from '@/schema-validations/auth.schema';
import { ErrorPayload } from '@/types/error.type';
import Cookies from 'js-cookie';
import { redirect } from 'next/navigation';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
};

// Định nghĩa các hằng số lỗi
const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;

// Định nghĩa kiểu dữ liệu cho lỗi thực thể
type EntityErrorPayload = {
  message: string;
  errors: { [key: string]: any };
};

// Lớp HttpError để xử lý lỗi HTTP
export class HttpError extends Error {
  status: number;
  payload: ErrorPayload;
  constructor({ status, payload, message = 'Lỗi HTTP' }: { status: number; payload: any; message?: string }) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

// Lớp EntityError kế thừa từ HttpError để xử lý lỗi thực thể
export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({ status, payload }: { status: typeof ENTITY_ERROR_STATUS; payload: any }) {
    super({ status, payload, message: payload.message || 'Lỗi thực thể' });
    this.status = status;
    this.payload = {
      message: payload.message || 'Lỗi thực thể',
      errors: payload.errors || {},
    };
  }
}

// Biến để đảm bảo chỉ có một request logout được gửi đi
let clientLogoutRequest: null | Promise<any> = null;

// Kiểm tra xem code đang chạy ở phía client hay server
const isClient = typeof window !== 'undefined';

// Hàm request để thực hiện các yêu cầu HTTP
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options?: CustomOptions | undefined
) => {
  // console.log('Starting request:', { method, url, options });

  let body: FormData | string | undefined = undefined;
  if (options?.body) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
    }
  }

  // console.log('Request body:', body);

  const baseHeaders: { [key: string]: string } =
    body instanceof FormData
      ? {}
      : {
        'Content-Type': 'application/json',
      };

  if (isClient) {
    const access_token = getAccessTokenFromLocalStorage();
    if (access_token) {
      baseHeaders.Authorization = `Bearer ${access_token}`;
    }
  } else {
    const access_token = Cookies.get('access_token');
    if (access_token) {
      baseHeaders.Authorization = `Bearer ${access_token}`;
    }
  }

  // console.log('Request headers:', baseHeaders);

  const baseUrl = options?.baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl;
  const fullUrl = `${baseUrl}/${normalizePath(url)}`;

  // console.log('Full URL:', fullUrl);

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
    } as any,
    body,
    method,
  });

  // console.log('Response status:', res.status);

  const contentType = res.headers.get('Content-Type');
  let payload: Response;
  if (contentType?.includes('application/json')) {
    payload = await res.json();
  } else {
    payload = (await res.text()) as any;
  }

  // console.log('Response payload:', payload);

  const data = {
    status: res.status,
    payload,
  };

  if (!res.ok) {
    // console.error('Request failed:', data);
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError({
        status: ENTITY_ERROR_STATUS,
        payload: data.payload,
      });
    } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      if (isClient) {
        if (!clientLogoutRequest) {
          clientLogoutRequest = (async () => {
            try {
              await fetch('/api/auth/logout', {
                method: 'POST',
                body: null,
                headers: baseHeaders,
              });
            } catch (error) {
              console.error('Error during logout:', error);
            } finally {
              removeTokensFromLocalStorage();
              localStorage.removeItem('project-storage');
              clientLogoutRequest = null;
              location.href = `/login`;
            }
          })();
        }
        await clientLogoutRequest;
      } else {
        const access_token = (options?.headers as { Authorization?: string })?.Authorization?.split('Bearer ')[1];
        if (access_token) {
          redirect(`/login?accessToken=${access_token}`);
        }
      }
    } else {
      throw new HttpError(data);
    }
  }

  if (isClient) {
    const normalizeUrl = normalizePath(url);
    if ('api/auth/login' === normalizeUrl) {
      const { access_token, refresh_token } = (payload as LoginResType).metadata;
      setAccessTokenToLocalStorage(access_token);
      setRefreshTokenToLocalStorage(refresh_token);
    } else if ('api/auth/refresh-token' === normalizeUrl || 'api/auth/token' === normalizeUrl) {
      const { access_token, refresh_token } = payload as {
        access_token: string;
        refresh_token: string;
      };
      setAccessTokenToLocalStorage(access_token);
      setRefreshTokenToLocalStorage(refresh_token);
    } else if ('api/auth/logout' === normalizeUrl) {
      removeTokensFromLocalStorage();
      localStorage.removeItem('project-storage');
    }
  }

  return data;
};

// Định nghĩa các phương thức HTTP
const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, options);
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body });
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body });
  },
  // delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
  //   return request<Response>('DELETE', url, { ...options });
  // },
  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> & { body?: any }) {
    return request<Response>('DELETE', url, { ...options });
  },
  patch<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PATCH', url, { ...options, body });
  },
};

export default http;