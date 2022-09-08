/*
* Dispatch Namespace name -- needs to be same value as defined in wrangler.toml
*/
export const DISPATCH_NAMESPACE_NAME = 'workers-for-platforms-example-project';

/*
* Available bindings -- defined in wrangler.toml
*/
export interface Env {
  dispatcher: Dispatcher,
  DB: any,
  DISPATCH_NAMESPACE_ACCOUNT_ID: string,
  DISPATCH_NAMESPACE_AUTH_EMAIL: string,
  DISPATCH_NAMESPACE_AUTH_KEY: string
}

interface Dispatcher {
  get: (scriptName: string) => Worker;
}

interface Worker {
  fetch: (request: any) => Promise<Response>;
}
