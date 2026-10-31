export interface AppErrorEvent {
  requestId: string;
  operation: string;
  status: number;
  errorCode: string;
}

export function logAppError(event: AppErrorEvent): void {
  console.error({
    event: "http.error",
    request_id: event.requestId,
    operation: event.operation,
    status: event.status,
    error_code: event.errorCode
  });
}
