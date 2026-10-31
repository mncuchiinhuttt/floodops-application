import { ApiError, RequestCancelledError } from "@floodops/api-client";
import { FeatureAccessError } from "../shared/client-context";
export function failureText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 410) return `Cần ghép nối lại phiên (${error.response.error.code}).`;
    if (error.status === 403) return "Capability hiện tại không cấp quyền này (403).";
    if (error.status === 412) return "Needs replan (412). Làm mới và xem lại, không gửi lại lệnh cũ.";
    if (error.status === 503) return `Backend chưa cung cấp dữ liệu: ${error.response.error.code} (503).`;
    if (error.status === 404) return "API chưa có tài nguyên hoặc chưa được mount (404 NOT_FOUND).";
    return `Yêu cầu bị từ chối: ${error.response.error.code} (${error.status}).`;
  }
  if (error instanceof Error && error.name === "ZodError") return "Nội dung chưa đúng định dạng. Kiểm tra các trường rồi gửi lại.";
  if (error instanceof FeatureAccessError) return error.message;
  if (error instanceof RequestCancelledError || (error instanceof Error && error.name === "AbortError")) return "Yêu cầu thuộc phiên cũ đã hủy.";
  return "Không nhận được phản hồi hợp lệ. Kiểm tra kết nối hoặc HTTPS/cookie rồi thử tải lại.";
}
