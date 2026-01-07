import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getAuthHeader } from '../auth';

export interface BlockMetadata {
  id: number;
  name: string;
  slug: string;
  codeFiles: Array<{
    sourceCode?: {
      name: string;
      url: string;
    };
  }>;
  _status: 'published' | 'draft';
}

export interface CodeFile {
  name: string;
  content: string;
}

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'blok0-cli/1.0.0'
      }
    });

    // Add auth header to all requests
    this.client.interceptors.request.use(async (config) => {
      const authHeader = await getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
      return config;
    });
  }

  /**
   * Fetch block metadata from URL
   */
  async fetchBlockMetadata(url: string): Promise<BlockMetadata> {
    try {
      const response: AxiosResponse<BlockMetadata> = await this.client.get(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please run `blok0 login` first.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Block not found at URL: ${url}`);
        }
        throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Download source code file
   */
  async downloadSourceCode(url: string): Promise<string> {
    try {
      const response: AxiosResponse<string> = await this.client.get(url, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to download source code from ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate block metadata
   */
  validateBlockMetadata(metadata: BlockMetadata): void {
    if (!metadata.id || typeof metadata.id !== 'number') {
      throw new Error('Invalid block metadata: missing or invalid id');
    }

    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error('Invalid block metadata: missing or invalid name');
    }

    if (!metadata.slug || typeof metadata.slug !== 'string') {
      throw new Error('Invalid block metadata: missing or invalid slug');
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(metadata.slug)) {
      throw new Error('Invalid block slug format. Must contain only lowercase letters, numbers, and dashes.');
    }

    if (!metadata.codeFiles || !Array.isArray(metadata.codeFiles)) {
      throw new Error('Invalid block metadata: missing or invalid codeFiles');
    }

    // Filter out malformed codeFiles entries
    const validCodeFiles = metadata.codeFiles.filter(file => file.sourceCode && file.sourceCode.name && file.sourceCode.url);

    if (validCodeFiles.length === 0) {
      throw new Error('Invalid block metadata: no valid code files specified');
    }

    // Check for required files
    const hasConfig = validCodeFiles.some(file => file.sourceCode!.name === 'config.ts');
    if (!hasConfig) {
      throw new Error('Invalid block metadata: config.ts file is required');
    }

    if (metadata._status !== 'published') {
      throw new Error('Block is not published and cannot be installed');
    }
  }

  /**
   * Fetch complete block data including source files
   */
  async fetchBlockData(url: string): Promise<{ metadata: BlockMetadata; files: CodeFile[] }> {
    const metadata = await this.fetchBlockMetadata(url);
    this.validateBlockMetadata(metadata);

    const files: CodeFile[] = [];

    // Filter out malformed codeFiles entries (same logic as validation)
    const validCodeFiles = metadata.codeFiles.filter(file => file.sourceCode && file.sourceCode.name && file.sourceCode.url);

    for (const fileInfo of validCodeFiles) {
      const { name, url: fileUrl } = fileInfo.sourceCode!;

      // Resolve relative URLs
      const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${this.baseURL}${fileUrl}`;

      try {
        const content = await this.downloadSourceCode(resolvedUrl);
        files.push({ name, content });
      } catch (error) {
        throw new Error(`Failed to download ${name}: ${(error as Error).message}`);
      }
    }

    return { metadata, files };
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to access a test endpoint or just check auth header
      const authHeader = await getAuthHeader();
      return authHeader !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export { APIClient };