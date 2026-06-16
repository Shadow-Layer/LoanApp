import axios, { AxiosError } from 'axios';
import { config } from '../config/env';

const client = axios.create({
  baseURL: config.odkBaseUrl,
  auth: {
    username: config.odkEmail,
    password: config.odkPassword
  }
});

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractOdkError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const responseData = axiosError.response?.data;
    if (typeof responseData === 'string') {
      return new Error(responseData);
    }
    if (responseData && typeof responseData === 'object' && 'message' in responseData && responseData.message) {
      return new Error(String(responseData.message));
    }
    return new Error(axiosError.message);
  }
  return error instanceof Error ? error : new Error('ODK request failed');
}

export class OdkService {
  static async listForms(): Promise<any[]> {
    try {
      const response = await client.get(`/v1/projects/${config.odkProjectId}/forms`);
      return response.data;
    } catch (error) {
      throw extractOdkError(error);
    }
  }

  static async submitForm(formId: string, fields: Record<string, string>): Promise<string> {
    const body = `<data id="${escapeXml(formId)}">${Object.entries(fields)
      .map(([key, value]) => `<${escapeXml(key)}>${escapeXml(value)}</${escapeXml(key)}>` )
      .join('')}</data>`;
    try {
      const response = await client.post(`/v1/projects/${config.odkProjectId}/forms/${formId}/submissions`, body, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
      const submissionId = response.data?.instanceId || response.data?.instance || response.data?.id;
      if (!submissionId) {
        throw new Error('Missing instance ID in ODK response');
      }
      return String(submissionId);
    } catch (error) {
      throw extractOdkError(error);
    }
  }

  static async getSubmission(formId: string, submissionId: string): Promise<any> {
    try {
      const response = await client.get(`/v1/projects/${config.odkProjectId}/forms/${formId}/submissions/${submissionId}`);
      return response.data;
    } catch (error) {
      throw extractOdkError(error);
    }
  }

  static async listSubmissions(formId: string): Promise<any[]> {
    try {
      const response = await client.get(`/v1/projects/${config.odkProjectId}/forms/${formId}/submissions`);
      return response.data;
    } catch (error) {
      throw extractOdkError(error);
    }
  }
}
