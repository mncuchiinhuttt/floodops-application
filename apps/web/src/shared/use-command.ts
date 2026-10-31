import { useEffect, useRef, useState } from "react";
import { ApiError } from "@floodops/api-client";
import { FeatureAccessError } from "./client-context";

export function commandError(error: unknown): string {
  if (error instanceof FeatureAccessError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 412) return "Needs replan — dữ liệu cũ. Làm mới và xem lại; lệnh chưa được gửi lại.";
    if (error.status === 401 || error.status === 403 || error.status === 410) return "Quyền hoặc phiên không còn khả dụng. Cần ghép nối lại.";
    return `Server từ chối: ${error.response.error.code}. Giữ nguyên nội dung để xem lại.`;
  }
  return "Không hoàn tất yêu cầu. Giữ nguyên nội dung; kiểm tra trạng thái server trước khi thử lại.";
}
export function useCommand(binding: string) {
  const current = useRef(binding); current.current = binding;
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { setMessage(null); }, [binding]);
  useEffect(() => () => { current.current = "unmounted"; }, []);
  async function run(action: () => Promise<unknown>) {
    if (inFlight.current) return;
    const captured = binding;
    inFlight.current = true; setPending(true); setMessage(null);
    try {
      await action();
      if (current.current === captured) setMessage("Đã nhận phản hồi. Làm mới dữ liệu để xem trạng thái có thẩm quyền.");
    } catch (error) { if (current.current === captured) setMessage(commandError(error)); }
    finally { inFlight.current = false; setPending(false); }
  }
  return { pending, message, run };
}
