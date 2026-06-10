import { APIRequestContext, APIResponse } from "@playwright/test";

interface RequestOptions {
  endpoint: string;
  data?: object | string;
  form?: Record<string, string>;
  headers?: Record<string, string>;
  method?: "post" | "get" | "put" | "delete" | "patch";
  baseUrl?: string;
}

export async function sendRequest(apiContext: APIRequestContext, options: RequestOptions) {
  const { endpoint, data, form, headers, method = "post", baseUrl } = options;
  const url = baseUrl ? `${baseUrl}/${endpoint}` : endpoint;

  let response: APIResponse;
  try {
    response = await apiContext[method](url, {
      ...(data && { data }),
      ...(form && { form }),
      ...(headers && { headers }),
      timeout: 30000,
    });
  } catch (err) {
    throw new Error(`[sendRequest] Network error — ${method.toUpperCase()} ${url}: ${(err as Error).message}`);
  }

  const responseText = await response.text();
  if (!response.ok()) {
    console.warn(`[sendRequest] ${method.toUpperCase()} ${url} → ${response.status()}`);
    console.warn(`[sendRequest] Response: ${responseText.substring(0, 500)}`);
  }

  let responseBody: unknown;
  try {
    responseBody =
      responseText.startsWith("{") || responseText.startsWith("[")
        ? JSON.parse(responseText)
        : { raw: responseText };
  } catch {
    throw new Error(`[sendRequest] Failed to parse JSON — ${method.toUpperCase()} ${url}: ${responseText.substring(0, 200)}`);
  }

  return { response, responseBody };
}
