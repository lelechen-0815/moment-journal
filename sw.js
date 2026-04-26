const CACHE_NAME = 'moment-journal-v4';

// 安装时不预缓存任何东西，避免缓存旧文件
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 激活时清除所有旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：只缓存静态资源，所有 API 请求直接放行
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 以下情况完全不拦截，直接走网络
  if (
    url.includes('supabase.co') ||
    url.includes('supabase.io') ||
    url.includes('supabase.com') ||
    event.request.method !== 'GET' ||
    event.request.headers.get('authorization') ||
    url.includes('/rest/') ||
    url.includes('/auth/') ||
    url.includes('/storage/')
  ) {
    return; // 不调用 event.respondWith，让浏览器直接处理
  }

  // 只对静态资源（html、js、css）做缓存
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
