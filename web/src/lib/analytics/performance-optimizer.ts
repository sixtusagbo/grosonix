// Simple LRU Cache implementation
class SimpleLRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; hits: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey!);
    }
    this.cache.set(key, { value, timestamp: Date.now(), hits: 0 });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    item.hits++;
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  forEach(callback: (value: { value: V; timestamp: number; hits: number }) => void): void {
    this.cache.forEach(callback);
  }
}

export interface PerformanceMetrics {
  component: string;
  renderTime: number;
  dataFetchTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  timestamp: string;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  batchSize: number;
  debounceMs: number;
}

export class PerformanceOptimizer {
  private cache: SimpleLRUCache<string, any>;
  private metrics: PerformanceMetrics[] = [];
  private config: OptimizationConfig;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableCaching: true,
      cacheSize: 100,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      enableLazyLoading: true,
      enableVirtualization: false,
      batchSize: 10,
      debounceMs: 300,
      ...config
    };

    this.cache = new SimpleLRUCache(this.config.cacheSize, this.config.cacheTTL);
    this.setupPerformanceMonitoring();
  }

  /**
   * Cache data with automatic expiration
   */
  cacheData<T>(key: string, data: T, customTTL?: number): void {
    if (!this.config.enableCaching) return;
    this.cache.set(key, data);
  }

  /**
   * Retrieve cached data
   */
  getCachedData<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    const cached = this.cache.get(key);
    return cached || null;
  }

  /**
   * Debounced function wrapper
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = this.config.debounceMs
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Batch process data
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = this.config.batchSize
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      // Small delay between batches to prevent blocking
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results;
  }

  /**
   * Measure component render performance
   */
  measureRenderTime(componentName: string): {
    start: () => void;
    end: () => number;
  } {
    let startTime: number;

    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        this.recordMetric({
          component: componentName,
          renderTime,
          dataFetchTime: 0,
          cacheHitRate: this.getCacheHitRate(),
          memoryUsage: this.getMemoryUsage(),
          timestamp: new Date().toISOString()
        });

        return renderTime;
      }
    };
  }

  /**
   * Measure data fetch performance
   */
  async measureDataFetch<T>(
    fetchFunction: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    const startTime = performance.now();

    // Check cache first
    if (cacheKey && this.config.enableCaching) {
      const cached = this.getCachedData<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await fetchFunction();
      const fetchTime = performance.now() - startTime;

      // Cache the result
      if (cacheKey) {
        this.cacheData(cacheKey, result);
      }

      this.recordMetric({
        component: 'DataFetch',
        renderTime: 0,
        dataFetchTime: fetchTime,
        cacheHitRate: this.getCacheHitRate(),
        memoryUsage: this.getMemoryUsage(),
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Data fetch error:', error);
      throw error;
    }
  }

  /**
   * Optimize images for better performance
   */
  optimizeImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}): string {
    const { width, height, quality = 80, format = 'webp' } = options;

    // For Next.js Image optimization
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', format);

    return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  /**
   * Virtual scrolling helper
   */
  calculateVirtualItems<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    overscan: number = 5
  ): {
    virtualItems: Array<{ index: number; item: T; top: number }>;
    totalHeight: number;
    startIndex: number;
    endIndex: number;
  } {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan);

    const virtualItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        item: items[i],
        top: i * itemHeight
      });
    }

    return {
      virtualItems,
      totalHeight,
      startIndex,
      endIndex
    };
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        // Long task API not supported
      }
    }

    // Monitor memory usage
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Clean up every minute
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get cache hit rate
   */
  private getCacheHitRate(): number {
    const totalRequests = this.cache.size;
    if (totalRequests === 0) return 0;

    let totalHits = 0;
    this.cache.forEach((value) => {
      totalHits += value.hits || 0;
    });

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(
      metric => new Date(metric.timestamp).getTime() > oneHourAgo
    );
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    averageRenderTime: number;
    averageDataFetchTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    slowComponents: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageDataFetchTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        slowComponents: []
      };
    }

    const renderTimes = this.metrics.filter(m => m.renderTime > 0);
    const fetchTimes = this.metrics.filter(m => m.dataFetchTime > 0);

    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, m) => sum + m.renderTime, 0) / renderTimes.length
      : 0;

    const averageDataFetchTime = fetchTimes.length > 0
      ? fetchTimes.reduce((sum, m) => sum + m.dataFetchTime, 0) / fetchTimes.length
      : 0;

    // Find slow components (render time > 100ms)
    const slowComponents = [...new Set(
      this.metrics
        .filter(m => m.renderTime > 100)
        .map(m => m.component)
    )];

    return {
      averageRenderTime,
      averageDataFetchTime,
      cacheHitRate: this.getCacheHitRate(),
      memoryUsage: this.getMemoryUsage(),
      slowComponents
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.cache.clear();
    this.metrics = [];
  }
}