import { type ClientSchema, a, defineData } from "@aws-amplify/backend";


export const IngestionStatus = ['NOT_STARTED', 'COMPLETED', 'FAILED']
export const VectorizationStatus = ['NOT_STARTED', 'COMPLETED', 'FAILED']
const schema = a.schema({
  JobFile: a
    .model({
      jobFileId: a.id(),
      name: a.string().required(),
      location: a.string().required(),
      ingestionStatus: a.enum(IngestionStatus),
      vectorizationStatus: a.enum(VectorizationStatus),
      jobId: a.string().required(),
      job: a.belongsTo('Job', 'jobId'),
    })
    .authorization((allow) => [allow.owner()]),

    // .authorization((allow) => [
    //   allow.owner().to(["delete", "get", "list", "update"]),
    //   allow.authenticated().to(["create"]),
    // ]),
  
  Job: a
    .model({
      jobId: a.id(),
      jobType: a.enum(["EMBEDDINGS", "LLMS"]),
      name: a.string(),
      selectedModels: a.string(),
      createdAt: a.datetime(),
      lastUpdatedAt: a.datetime(),
      files: a.hasMany('JobFile', 'jobId'),
      ragIngestionStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      ragIngestionStatusMessage: a.string(),
      evalDatasetGenerationStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      evalDatasetGenerationStatusMessage: a.string(),
      evalDatasetApprovalStatus: a.enum(["NOT_STARTED", "NOT_APPROVED", "APPROVED"]),
      evalDatasetStatusMessage: a.string(),
      evalStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      evalStatusMessage: a.string()
    })
    .authorization((allow) => [allow.owner()])

    //   allow.owner().to(["delete", "get", "list", "update"]),
    //   allow.authenticated().to(["create"]),
  });

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
