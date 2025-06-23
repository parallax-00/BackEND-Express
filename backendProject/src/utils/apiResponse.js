class ApiResponse {
  constructor(statusCode, message = " success", data) {
    this.statusCode = statusCode < 400;
    this.message = message;
    this.success = true;
    this.data = data;
  }
}
export { ApiResponse };
