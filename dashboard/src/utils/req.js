import axios from 'axios';

// 创建一个 Axios 实例
const req = axios.create({
    baseURL: 'http://127.0.0.1:9978',  // 默认的 API 根地址
    timeout: 5000,  // 请求超时限制
    headers: {
        'Content-Type': 'application/json', // 默认请求头
    },
});

// 请求拦截器
req.interceptors.request.use(
    (config) => {
        // 可以在请求发送前做一些处理，例如添加 token
        const token = localStorage.getItem('token'); // 假设 token 存储在 localStorage 中
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
req.interceptors.response.use(
    (response) => {
        // 如果有需要，可以在这里统一处理响应数据
        return response.data;
    },
    (error) => {
        // 错误处理，例如 token 失效、网络错误等
        if (error.response) {
            // 服务器返回的错误信息
            console.error(`Error ${error.response.status}: ${error.response.data.message}`);
        } else {
            // 网络或其他错误
            console.error('Network error or timeout', error);
        }
        return Promise.reject(error);
    }
);

if (process.env.NODE_ENV === 'development') {
    req.defaults.baseURL = 'http://127.0.0.1:9978'; // 开发环境使用本地服务器
} else {
    req.defaults.baseURL = ''; // 生产环境使用线上 API
}


export default req;
