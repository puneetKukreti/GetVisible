import { ProviderExecutionResult, ProviderStatus } from './provider-result';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  waitForTimeout?: number;
  format?: 'png' | 'jpeg';
}

export interface ScreenshotResult {
  screenshotUrl: string;
  source: 'microlink' | 'screenshotone' | 'urlbox' | 'mock';
  width: number;
  height: number;
}

export interface IScreenshotProvider {
  name: string;
  isConfigured(): boolean;
  getStatus(): ProviderStatus;
  captureWebsite(targetUrl: string, options?: ScreenshotOptions): Promise<ProviderExecutionResult<ScreenshotResult>>;
}

export class CloudScreenshotProvider implements IScreenshotProvider {
  name = 'CloudScreenshotProvider';

  private screenshotOneKey = process.env.SCREENSHOTONE_API_KEY;
  private urlboxKey = process.env.URLBOX_API_KEY;

  isConfigured(): boolean {
    // Microlink is available without an API key as a zero-config cloud provider
    return true;
  }

  getStatus(): ProviderStatus {
    const isDedicated = Boolean(this.screenshotOneKey || this.urlboxKey);
    return {
      name: this.name,
      configured: true,
      isMock: false,
      details: isDedicated
        ? 'Dedicated high-volume screenshot API configured.'
        : 'Zero-config cloud screenshot provider active (Microlink).',
    };
  }

  async captureWebsite(
    targetUrl: string,
    options?: ScreenshotOptions
  ): Promise<ProviderExecutionResult<ScreenshotResult>> {
    const width = options?.width || 1280;
    const height = options?.height || 800;

    try {
      // 1. ScreenshotOne if configured
      if (this.screenshotOneKey) {
        const query = new URLSearchParams({
          access_key: this.screenshotOneKey,
          url: targetUrl,
          viewport_width: String(width),
          viewport_height: String(height),
          device_scale_factor: String(options?.deviceScaleFactor || 2),
          format: options?.format || 'jpeg',
          cache: 'true',
          cache_ttl: '86400',
        });

        const screenshotUrl = `https://api.screenshotone.com/take?${query.toString()}`;
        return {
          success: true,
          configured: true,
          isMock: false,
          data: {
            screenshotUrl,
            source: 'screenshotone',
            width,
            height,
          },
        };
      }

      // 2. Default Zero-Config: Microlink API CDN
      // Microlink generates a fast, public, cached screenshot URL from any accessible public web page
      const encodedUrl = encodeURIComponent(targetUrl);
      const microlinkUrl = `https://api.microlink.io?url=${encodedUrl}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=${width}&viewport.height=${height}`;

      return {
        success: true,
        configured: true,
        isMock: false,
        data: {
          screenshotUrl: microlinkUrl,
          source: 'microlink',
          width,
          height,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        configured: true,
        isMock: false,
        error: `Screenshot generation failed: ${msg}`,
      };
    }
  }
}

export class MockScreenshotProvider implements IScreenshotProvider {
  name = '[DEMO MOCK] ScreenshotProvider';

  isConfigured(): boolean {
    return true;
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      configured: true,
      isMock: true,
      details: 'Mock screenshot provider returning simulated preview badge for sandboxed environments.',
    };
  }

  async captureWebsite(
    targetUrl: string,
    options?: ScreenshotOptions
  ): Promise<ProviderExecutionResult<ScreenshotResult>> {
    const width = options?.width || 1280;
    const height = options?.height || 800;

    // Use a clean placeholder preview image with CA theme
    const mockPreviewUrl = `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

    return {
      success: true,
      configured: true,
      isMock: true,
      data: {
        screenshotUrl: mockPreviewUrl,
        source: 'mock',
        width,
        height,
      },
    };
  }
}
