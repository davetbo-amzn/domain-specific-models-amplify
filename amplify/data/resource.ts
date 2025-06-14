import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
 
  JobFile: a
    .model({
      jobFileId: a.id(),
      jobFileLocation: a.string(),
      isIngested: a.boolean().default(false),
      isEvalDatasetGenerationComplete: a.boolean().default(false),
      isRagIngestionComplete: a.boolean().default(false),
      isEvalDatasetApproved: a.boolean().default(false),
      isEvalComplete: a.boolean().default(false),
      jobId: a.id(),
      job: a.belongsTo('Job', 'jobId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  
  Job: a
    .model({
      userId: a.string(),
      name: a.string(),
      selectedModels: a.string(),
      createdAt: a.datetime(),
      lastUpdatedAt: a.datetime(),
      files: a.hasMany('JobFile', 'jobId'),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
