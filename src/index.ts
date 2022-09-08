import { Router } from 'itty-router';

import {
  FetchTable,
  Initialize
} from './db';
import {
  DISPATCH_NAMESPACE_NAME,
  Env
} from './env';
import {
  GetScriptsByTags,
  DeleteScriptInDispatchNamespace,
  GetScriptsInDispatchNamespace,
  PutScriptInDispatchNamespace,
  PutTagsOnScript,
  GetTagsOnScript
} from './resource';
import {
  ApiResponse,
  HtmlResponse,
  JsonResponse,
  IRequest,
  WithCustomer,
  WithDB
} from './router';
import {
  BuildTable,
  UploadPage
} from './render';

const router = Router();

export default {
  fetch: router.handle
}

router
  .get('/favicon.ico', () => {
    return new Response();
  });

router
  /*
  * Dumps the state of the app
  */
  .get('/', WithDB, async (request: IRequest, env: Env) => {
    let body = '<h2>DB Tables</h2>';

    /*
    * DB data
    */
    try {
      body += [
        BuildTable('customers', (await FetchTable(request.db, 'customers'))),
        BuildTable('customer_tokens', (await FetchTable(request.db, 'customer_tokens')))
      ].join('');
    } catch (e) {
      body += '<div>No DB data. Do you need to <a href="/init">init</a>?</div>';
    }

    /*
    * Dispatch Namespace data
    */
    try {
      const scripts = await GetScriptsInDispatchNamespace(env);
      body += '</br><h2>Dispatch Namespace</h2>'
      body += BuildTable(DISPATCH_NAMESPACE_NAME, scripts);
    } catch(e) {
      body += `<div>Dispatch namespace "${DISPATCH_NAMESPACE_NAME}" was not found.</div>`;
    }

    return HtmlResponse(body);
  })

  /*
  * Initialize example data
  */
  .get('/init', WithDB, async (request: IRequest, env: Env) => {
    (await GetScriptsInDispatchNamespace(env))
      .forEach(async script => await DeleteScriptInDispatchNamespace(env, script.id));
    await Initialize(request.db);
    return Response.redirect(request.url.replace('/init', ''));
  })

  /*
  * Where a customer can upload a script
  */
  .get('/upload', async () => {
    return HtmlResponse(UploadPage);
  })

  /*
  * Gets scripts for a customer
  */
  .get('/script', WithDB, WithCustomer, async (request: IRequest, env: Env) => {
    const scripts = await GetScriptsByTags(env, [{ tag: request.customer.id, allow: true }]);
    return JsonResponse(scripts);
  })

  /*
  * Dispatch a script
  */
  .get('/dispatch/:name', async (request: IRequest, env: Env) => {
    try {
      // TODO: doesn't work with wrangler local yet
      const worker = env.dispatcher.get(request.params.name);
      return await worker.fetch(request);
    } catch(e: any) {
      if (e.message == 'Error: Worker not found.') { return ApiResponse('Script does not exist', 404); }
      /*
      * This is a notable error that should be logged.
      */
      console.log(JSON.stringify(e, Object.getOwnPropertyNames(e)));
      return ApiResponse('Could not connect to script', 500);
    }
  })

  /*
  * Uploads a customer script
  */
  .put('/script/:name', WithDB, WithCustomer, async (request: IRequest, env: Env) => {
    const scriptName = request.params.name;

    /* 
    * Check if script name exists and is owned by customer.
    * If exists and not owned, deny request.
    * If exists and owned, the request is good and means the script is being updated.
    * If not exists, it's the customer's to claim.
    */
    const tags = await GetTagsOnScript(env, scriptName);
    if (tags && !tags.includes(request.customer.id)) {
      return ApiResponse('Script name already reserved', 409);
    }

    /* 
    * Get script content from request.
    */
    let scriptContent: string;
    try {
      scriptContent = (await request.json?.())?.script;
    } catch(e) {
      return ApiResponse('Expected json: { script: string }', 400);
    }

    /* 
    * Upload the script to the dispatch namespace.
    * On error, forward the response from the dispatch namespace API
    * since it gives necessary feedback to the customer.
    */
    const scriptResponse = await PutScriptInDispatchNamespace(env, scriptName, scriptContent);
    if (scriptResponse.status !== 200) {
      return JsonResponse(await scriptResponse.json(), 400);
    }

    /*
    * Add customer_id and plan_type as script tags.
    * If that errors, something is wrong so log it!
    * Could add logic to delete script if that's immediately problematic.
    */
    const tagsResponse = await PutTagsOnScript(env, scriptName, [request.customer.id, request.customer.plan_type]);
    if (tagsResponse.status !== 200) {
      console.log('Could not PUT tags on script', tagsResponse.status, await tagsResponse.text());
    }

    return ApiResponse('Success', 201);
  })
