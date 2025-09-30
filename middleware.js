import { NextResponse } from "next/server";

export const config = {
  runtime: 'nodejs',
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};

export default async function middleware(request) {
  const response = NextResponse.next();

  const time = Date.now();
  const timeStr = new Date(time).toLocaleDateString();

  const logData = `time: ${timeStr}  ${request.method} ${request.url} ip: ${request.ip} ua: ${request.userAgent} geo: ${JSON.stringify(request.geo)}`;

  console.log(logData);

  return response;
}