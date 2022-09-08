import { DISPATCH_NAMESPACE_NAME, Env } from './env';

const BaseURI = (env: Env) => `https://api.cloudflare.com/client/v4/accounts/${env.DISPATCH_NAMESPACE_ACCOUNT_ID}/workers`;
const ScriptURI = (env: Env) => `${BaseURI(env)}/dispatch/namespaces/${DISPATCH_NAMESPACE_NAME}/scripts`;

const MakeHeaders = (env: Env) => {
  return {
    'X-Auth-Email': env.DISPATCH_NAMESPACE_AUTH_EMAIL,
    'X-Auth-Key': env.DISPATCH_NAMESPACE_AUTH_KEY
  };
}

interface ApiScript {
  id: string,
  modified_on: string,
  created_on: string
}

export async function GetScriptsInDispatchNamespace(env: Env): Promise<ApiScript[]> {
  const data = (await (await fetch(ScriptURI(env), {
    method: 'GET',
    headers: MakeHeaders(env)
  })).json()) as { result: any[] };
  return data.result.map(result => <ApiScript>{
    id: result.id,
    modified_on: result.modified_on,
    created_on: result.created_on
  });
}

export async function GetScriptsByTags(env: Env, tags: { tag: string, allow: boolean }[]): Promise<ApiScript[]> {
  const uriTags = tags.map(tag => `${tag.tag}:${tag.allow ? 'yes' : 'no'}`).join(',');
  const data = (await (await fetch(`${ScriptURI(env)}?tags=${uriTags}`, {
    method: 'GET',
    headers: MakeHeaders(env)
  })).json()) as { result: any[] };
  return data.result.map(result => <ApiScript>{
    id: result.id,
    modified_on: result.modified_on,
    created_on: result.created_on
  });
}

export async function GetTagsOnScript(env: Env, scriptName: string): Promise<string[]> {
  const data = (await (await fetch(`${ScriptURI(env)}/${scriptName}/tags`, {
    method: 'GET',
    headers: MakeHeaders(env)
  })).json()) as any;
  return data.result;
}

export async function PutScriptInDispatchNamespace(env: Env, scriptName: string, scriptContent: string): Promise<Response> {
  return await fetch(`${ScriptURI(env)}/${scriptName}`, {
    method: 'PUT',
    body: scriptContent,
    headers: {
      'Content-Type': 'application/javascript',
      ...MakeHeaders(env)
    }
  });
}

export async function DeleteScriptInDispatchNamespace(env: Env, scriptName: string): Promise<Response> {
  return await fetch(`${ScriptURI(env)}/${scriptName}`, {
    method: 'DELETE',
    headers: MakeHeaders(env)
  });
}

export async function PutTagsOnScript(env: Env, scriptName: string, tags: string[]): Promise<Response> {
  return await fetch(`${ScriptURI(env)}/${scriptName}/tags`, {
    method: 'PUT',
    body: JSON.stringify(tags),
    headers: {
      'Content-Type': 'application/javascript',
      ...MakeHeaders(env)
    }
  });
}
