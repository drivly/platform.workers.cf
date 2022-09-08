import { Request } from 'itty-router';
import { D1QB } from 'workers-qb';

import { Customer, GetCustomerFromToken } from './db';
import { Env } from './env';
import { HtmlPage } from './render';

const CUSTOMER_AUTH_HEADER_KEY = 'X-Customer-Token';

export interface IRequest extends Request {
  params: any,
  db: D1QB,
  customer: Customer
}

/*
* This middleware adds the workers-qb DB accessor to the request.
*/
export async function WithDB(request: any, env: Env) {
  request.db = new D1QB(env.DB);
}

/* 
* This middleware authenticates there is a valid user token.
* If it is, add the customer data to the request.
* WARNING -- This is an example and should not be used for production!
*/
export async function WithCustomer(request: any) {
  const token = request.headers.get(CUSTOMER_AUTH_HEADER_KEY);
  if (!token) {
    return ApiResponse(`${CUSTOMER_AUTH_HEADER_KEY} header is not set`, 403);
  }
  try {
    const customer = await GetCustomerFromToken(request.db, token);
    request.customer = customer;
  } catch (e) {
    return ApiResponse(`Unauthorized ${CUSTOMER_AUTH_HEADER_KEY}`, 403);
  }
}

export function ApiResponse(data: any, status=200): Response {
  return new Response(data, { status: status });
}

export function JsonResponse(data: any, status=200): Response {
  return new Response(JSON.stringify(data), {
    status: status, headers: { 'content-type': 'application/json' }
  });
}

export function HtmlResponse(body: string): Response {
  return new Response(HtmlPage(body), {
    headers: { 'content-type': 'text/html;charset=UTF-8' }
  });
}
