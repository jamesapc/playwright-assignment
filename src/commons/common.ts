import { APIRequestContext } from "@playwright/test";

interface RequestOptions {
  endpoint: string;
  data?: object | string;
  form?: Record<string, string>;
  headers?: Record<string, string>;
  method?: "post" | "get" | "put" | "delete";
  baseUrl?: string;
}

export async function sendRequest(apiContext: APIRequestContext, options: RequestOptions) {
  const { endpoint, data, form, headers, method = "post", baseUrl } = options;
  const url = baseUrl ? `${baseUrl}/${endpoint}` : endpoint;

  const response = await apiContext[method](url, {
    ...(data && { data }),
    ...(form && { form }),
    ...(headers && { headers }),
    timeout: 30000,
  });

  const responseText = await response.text();
  if (!response.ok()) {
    console.warn(`[sendRequest] ${method.toUpperCase()} ${url} → ${response.status()}`);
    console.warn(`[sendRequest] Response: ${responseText.substring(0, 500)}`);
  }

  const responseBody =
    responseText.startsWith("{") || responseText.startsWith("[")
      ? JSON.parse(responseText)
      : { raw: responseText };

  return { response, responseBody };
}
